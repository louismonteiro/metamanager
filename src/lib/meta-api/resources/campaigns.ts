import type { MetaApiClient } from "../client";
import type { Page, PaginationParams } from "../types";

/**
 * Campaign fields the product needs to answer "que campanhas tenho?": identity,
 * delivery state, objective and money. Budgets come from the node itself, so a
 * listing never needs an insights call to say what a campaign is set to spend.
 */
export const CAMPAIGN_FIELDS = [
  "id",
  "name",
  "status",
  "effective_status",
  "objective",
  "daily_budget",
  "lifetime_budget",
  "budget_remaining",
  "start_time",
  "stop_time",
  "created_time",
  "updated_time",
] as const;

/** Configured state, as set on the campaign. */
export type CampaignStatus = "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";

/** `Campaign` node. Monetary fields are strings in the account's minor units. */
export interface Campaign {
  id: string;
  name?: string;
  status?: CampaignStatus | string;
  /** Delivery state, which folds in the parent and account state. */
  effective_status?: string;
  objective?: string;
  /** Minor units (cents for EUR), as a string. */
  daily_budget?: string;
  lifetime_budget?: string;
  budget_remaining?: string;
  start_time?: string;
  stop_time?: string;
  created_time?: string;
  updated_time?: string;
}

/** One `insights` row read at `level=campaign`. */
export interface CampaignSpendRow {
  campaign_id?: string;
  campaign_name?: string;
  /** Major units (euros), as a decimal string — unlike the budget fields. */
  spend?: string;
  impressions?: string;
  clicks?: string;
  date_start?: string;
  date_stop?: string;
}

export const CAMPAIGN_SPEND_FIELDS = [
  "campaign_id",
  "campaign_name",
  "spend",
  "impressions",
  "clicks",
] as const;

/** Portuguese labels for the states the chat surfaces. */
const CAMPAIGN_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "ativa",
  PAUSED: "em pausa",
  DELETED: "eliminada",
  ARCHIVED: "arquivada",
  IN_PROCESS: "em processamento",
  WITH_ISSUES: "com problemas",
  PENDING_REVIEW: "em revisão",
  DISAPPROVED: "reprovada",
  PREAPPROVED: "pré-aprovada",
  PENDING_BILLING_INFO: "sem dados de faturação",
  CAMPAIGN_PAUSED: "campanha em pausa",
  ADSET_PAUSED: "ad set em pausa",
};

/** Never invents a label: an unmapped state is reported as it came. */
export function campaignStatusLabel(status: string | undefined): string {
  if (!status) return "estado desconhecido";
  return CAMPAIGN_STATUS_LABEL[status] ?? status.toLowerCase();
}

/**
 * Converts a Graph monetary string to euros.
 *
 * Budgets are returned in the account currency's minor unit. The product
 * operates exclusively in EUR, so the divisor is a fixed 100.
 */
export function minorUnitsToEur(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === null || raw.trim() === "") return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed / 100 : undefined;
}

/** Converts an insights amount, which already comes in major units. */
export function majorUnitsToEur(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === null || raw.trim() === "") return undefined;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Normalises `123` or `act_123` to the prefixed form the Graph API expects. */
export function toAccountPath(accountId: string): string {
  const trimmed = accountId.trim();
  return trimmed.startsWith("act_") ? trimmed : `act_${trimmed}`;
}

export function campaignsEdge(accountId: string): string {
  return `${toAccountPath(accountId)}/campaigns`;
}

export function campaignInsightsEdge(accountId: string): string {
  return `${toAccountPath(accountId)}/insights`;
}

export interface ListCampaignsOptions extends PaginationParams {
  fields?: readonly string[];
  /**
   * Graph `effective_status` filter, e.g. `["ACTIVE"]`. Without it the edge
   * returns every campaign that is not deleted.
   */
  effectiveStatus?: readonly string[];
}

function campaignParams(options: ListCampaignsOptions): Record<string, string> {
  const params: Record<string, string> = {};
  if (options.effectiveStatus?.length) {
    // Graph filters on this edge take a JSON-encoded array of states.
    params.effective_status = JSON.stringify([...options.effectiveStatus]);
  }
  return params;
}

/** Lists one page of the account's campaigns. */
export async function listCampaigns(
  client: MetaApiClient,
  accountId: string,
  options: ListCampaignsOptions = {},
): Promise<Page<Campaign>> {
  return client.getPage<Campaign>(campaignsEdge(accountId), {
    fields: options.fields ?? CAMPAIGN_FIELDS,
    limit: options.limit ?? 25,
    ...campaignParams(options),
    ...(options.after ? { after: options.after } : {}),
    ...(options.before ? { before: options.before } : {}),
  });
}

/** Collects every campaign of the account across pages. */
export async function listAllCampaigns(
  client: MetaApiClient,
  accountId: string,
  options: ListCampaignsOptions & { maxPages?: number } = {},
): Promise<Campaign[]> {
  return client.collect<Campaign>(
    campaignsEdge(accountId),
    {
      fields: options.fields ?? CAMPAIGN_FIELDS,
      limit: options.limit ?? 25,
      ...campaignParams(options),
    },
    { maxPages: options.maxPages ?? 10 },
  );
}

export interface ListCampaignSpendOptions extends PaginationParams {
  /** Insights window. Defaults to `maximum` — the campaign's whole life. */
  datePreset?: string;
  fields?: readonly string[];
}

/**
 * Reads spend per campaign from the account insights edge.
 *
 * Deliberately a separate call from {@link listCampaigns} rather than a nested
 * `insights{spend}` field expansion: insights are slower, throttled on their own
 * budget, and may be unavailable — as an independent request their failure costs
 * the spend column, not the whole listing.
 */
export async function listCampaignSpend(
  client: MetaApiClient,
  accountId: string,
  options: ListCampaignSpendOptions = {},
): Promise<Page<CampaignSpendRow>> {
  return client.getPage<CampaignSpendRow>(campaignInsightsEdge(accountId), {
    level: "campaign",
    fields: options.fields ?? CAMPAIGN_SPEND_FIELDS,
    date_preset: options.datePreset ?? "maximum",
    limit: options.limit ?? 100,
    ...(options.after ? { after: options.after } : {}),
  });
}

/** Indexes spend rows by campaign id, in euros. */
export function indexSpendByCampaign(
  rows: readonly CampaignSpendRow[],
): Map<string, number> {
  const byCampaign = new Map<string, number>();
  for (const row of rows) {
    if (!row.campaign_id) continue;
    const spendEur = majorUnitsToEur(row.spend);
    if (spendEur === undefined) continue;
    byCampaign.set(row.campaign_id, spendEur);
  }
  return byCampaign;
}
