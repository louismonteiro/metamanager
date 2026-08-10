import type { MetaApiClient } from "../client";
import type { Page, PaginationParams } from "../types";
import { minorUnitsToEur } from "./campaigns";
export { minorUnitsToEur };

/**
 * Ad set fields the product needs to answer "que ad sets tenho?": identity,
 * delivery state, budget, optimization and targeting summary.
 */
export const ADSET_FIELDS = [
  "id",
  "name",
  "status",
  "effective_status",
  "campaign_id",
  "daily_budget",
  "lifetime_budget",
  "optimization_goal",
  "billing_event",
  "targeting",
  "start_time",
  "end_time",
  "created_time",
  "updated_time",
] as const;

/** Configured state, as set on the ad set. */
export type AdSetStatus =
  | "ACTIVE"
  | "PAUSED"
  | "DELETED"
  | "ARCHIVED"
  | "IN_PROCESS"
  | "WITH_ISSUES"
  | "PENDING_REVIEW"
  | "DISAPPROVED"
  | "PREAPPROVED"
  | "PENDING_BILLING_INFO";

/** Union of all possible ad set status values for runtime checks. */
export const ADSET_STATUS: AdSetStatus[] = [
  "ACTIVE",
  "PAUSED",
  "DELETED",
  "ARCHIVED",
  "IN_PROCESS",
  "WITH_ISSUES",
  "PENDING_REVIEW",
  "DISAPPROVED",
  "PREAPPROVED",
  "PENDING_BILLING_INFO",
];

/** Simplified targeting summary for display. */
export interface TargetingSummary {
  geo_locations?: string;
  age_min?: number;
  age_max?: number;
  genders?: number[];
  interests?: string[];
  behaviors?: string[];
}

/** `AdSet` node. Monetary fields are strings in the account's minor units. */
export interface AdSet {
  id: string;
  name?: string;
  status?: AdSetStatus | string;
  /** Delivery state, which folds in the parent and account state. */
  effective_status?: string;
  campaign_id?: string;
  /** Minor units (cents for EUR), as a string. */
  daily_budget?: string;
  lifetime_budget?: string;
  optimization_goal?: string;
  billing_event?: string;
  targeting?: TargetingSummary | Record<string, unknown>;
  start_time?: string;
  end_time?: string;
  created_time?: string;
  updated_time?: string;
}

/** Portuguese labels for the states the chat surfaces. */
const ADSET_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "ativo",
  PAUSED: "em pausa",
  DELETED: "eliminado",
  ARCHIVED: "arquivado",
  IN_PROCESS: "em processamento",
  WITH_ISSUES: "com problemas",
  PENDING_REVIEW: "em revisão",
  DISAPPROVED: "reprovado",
  PREAPPROVED: "pré-aprovado",
  PENDING_BILLING_INFO: "sem dados de faturação",
  CAMPAIGN_PAUSED: "campanha em pausa",
};

/** Never invents a label: an unmapped state is reported as it came. */
export function adSetStatusLabel(status: string | undefined): string {
  if (!status) return "estado desconhecido";
  return ADSET_STATUS_LABEL[status] ?? status.toLowerCase();
}

/** Builds the path to the ad sets edge for an account. */
export function adSetsEdge(accountId: string): string {
  const trimmed = accountId.trim();
  const accountPath = trimmed.startsWith("act_") ? trimmed : `act_${trimmed}`;
  return `${accountPath}/adsets`;
}

/** Builds the path to a single ad set by ID. */
export function adSetPath(adSetId: string): string {
  return adSetId;
}

export interface ListAdSetsOptions extends PaginationParams {
  fields?: readonly string[];
  /** Filter by campaign ID (optional). */
  campaignId?: string;
  /**
   * Graph `effective_status` filter, e.g. `["ACTIVE"]`.
   */
  effectiveStatus?: readonly string[];
}

function adSetParams(options: ListAdSetsOptions): Record<string, string> {
  const params: Record<string, string> = {};
  if (options.campaignId) {
    // Filter ad sets by campaign using the campaign_id field
    params.campaign_id = options.campaignId;
  }
  if (options.effectiveStatus?.length) {
    params.effective_status = JSON.stringify([...options.effectiveStatus]);
  }
  return params;
}

/** Lists one page of the account's ad sets (optionally filtered by campaign). */
export async function listAdSets(
  client: MetaApiClient,
  accountId: string,
  options: ListAdSetsOptions = {},
): Promise<Page<AdSet>> {
  return client.getPage<AdSet>(adSetsEdge(accountId), {
    fields: options.fields ?? ADSET_FIELDS,
    limit: options.limit ?? 25,
    ...adSetParams(options),
    ...(options.after ? { after: options.after } : {}),
    ...(options.before ? { before: options.before } : {}),
  });
}

/** Collects every ad set of the account across pages. */
export async function listAllAdSets(
  client: MetaApiClient,
  accountId: string,
  options: ListAdSetsOptions & { maxPages?: number } = {},
): Promise<AdSet[]> {
  return client.collect<AdSet>(
    adSetsEdge(accountId),
    {
      fields: options.fields ?? ADSET_FIELDS,
      limit: options.limit ?? 25,
      ...adSetParams(options),
    },
    { maxPages: options.maxPages ?? 10 },
  );
}

/** Fetches a single ad set by ID. */
export async function getAdSet(
  client: MetaApiClient,
  adSetId: string,
  fields?: readonly string[],
): Promise<AdSet> {
  const result = await client.request<AdSet>(adSetPath(adSetId), {
    searchParams: {
      fields: fields?.join(",") ?? ADSET_FIELDS.join(","),
    },
  });
  return result.data;
}

/** Extracts a simplified targeting summary for display. */
export function summarizeTargeting(
  targeting: AdSet["targeting"],
): TargetingSummary {
  if (!targeting || typeof targeting !== "object") {
    return {};
  }

  const t = targeting as Record<string, unknown>;
  const summary: TargetingSummary = {};

  // Geo locations
  const geo = t.geo_locations as
    { custom_locations?: Array<{ name?: string }> } | undefined;
  if (geo?.custom_locations?.length) {
    summary.geo_locations = geo.custom_locations
      .map((loc) => loc.name)
      .filter(Boolean)
      .join(", ");
  }

  // Age range
  summary.age_min = t.age_min as number | undefined;
  summary.age_max = t.age_max as number | undefined;

  // Genders: Graph returns 1=male, 2=female
  const genders = t.genders as number[] | undefined;
  if (genders?.length) {
    summary.genders = genders;
  }

  // Interests
  const interests = t.interests as Array<{ name?: string }> | undefined;
  if (interests?.length) {
    summary.interests = interests
      .map((i) => i.name)
      .filter(Boolean) as string[];
  }

  // Behaviors
  const behaviors = t.behaviors as Array<{ name?: string }> | undefined;
  if (behaviors?.length) {
    summary.behaviors = behaviors
      .map((b) => b.name)
      .filter(Boolean) as string[];
  }

  return summary;
}

/** Formats a budget (in minor units) as EUR, or returns undefined if not set. */
export function formatAdSetBudget(adSet: AdSet): {
  daily?: number;
  lifetime?: number;
  label: "diário" | "vitalício" | undefined;
} {
  const daily = minorUnitsToEur(adSet.daily_budget);
  const lifetime = minorUnitsToEur(adSet.lifetime_budget);

  let label: "diário" | "vitalício" | undefined = undefined;
  if (daily !== undefined) {
    label = "diário";
  } else if (lifetime !== undefined) {
    label = "vitalício";
  }

  return { daily, lifetime, label };
}
