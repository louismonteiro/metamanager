import type { MetaApiClient } from "../client";
import type { Page, PaginationParams } from "../types";

/**
 * Ad fields the product needs to answer "que anúncios tenho?": identity,
 * delivery state, parent ad set, and creative summary.
 */
export const AD_FIELDS = [
  "id",
  "name",
  "status",
  "effective_status",
  "adset_id",
  "campaign_id",
  "creative",
  "preview_url",
  "created_time",
  "updated_time",
] as const;

/** Configured state, as set on the ad. */
export type AdStatus =
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

/** Union of all possible ad status values for runtime checks. */
export const AD_STATUS: AdStatus[] = [
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

/** Simplified creative summary for display. */
export interface CreativeSummary {
  body?: string;
  headline?: string;
  title?: string;
  image_url?: string;
  video_url?: string;
  call_to_action_type?: string;
  link_url?: string;
}

/** `Ad` node. */
export interface Ad {
  id: string;
  name?: string;
  status?: AdStatus | string;
  /** Delivery state, which folds in the parent and account state. */
  effective_status?: string;
  adset_id?: string;
  campaign_id?: string;
  creative?: CreativeSummary | Record<string, unknown>;
  preview_url?: string;
  created_time?: string;
  updated_time?: string;
}

/** Portuguese labels for the states the chat surfaces. */
const AD_STATUS_LABEL: Record<string, string> = {
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
  ADSET_PAUSED: "ad set em pausa",
};

/** Never invents a label: an unmapped state is reported as it came. */
export function adStatusLabel(status: string | undefined): string {
  if (!status) return "estado desconhecido";
  return AD_STATUS_LABEL[status] ?? status.toLowerCase();
}

/** Builds the path to the ads edge for an account. */
export function adsEdge(accountId: string): string {
  const trimmed = accountId.trim();
  const accountPath = trimmed.startsWith("act_") ? trimmed : `act_${trimmed}`;
  return `${accountPath}/ads`;
}

/** Builds the path to the ads edge for a specific ad set. */
export function adsByAdSetEdge(adSetId: string): string {
  return `${adSetId}/ads`;
}

/** Builds the path to the ads edge for a specific campaign. */
export function adsByCampaignEdge(campaignId: string): string {
  return `${campaignId}/ads`;
}

/** Builds the path to a single ad by ID. */
export function adPath(adId: string): string {
  return adId;
}

export interface ListAdsOptions extends PaginationParams {
  fields?: readonly string[];
  /** Filter by ad set ID (optional). */
  adSetId?: string;
  /** Filter by campaign ID (optional). */
  campaignId?: string;
  /**
   * Graph `effective_status` filter, e.g. `["ACTIVE"]`.
   */
  effectiveStatus?: readonly string[];
}

function adsParams(options: ListAdsOptions): Record<string, string> {
  const params: Record<string, string> = {};
  if (options.adSetId) {
    params.adset_id = options.adSetId;
  }
  if (options.campaignId) {
    params.campaign_id = options.campaignId;
  }
  if (options.effectiveStatus?.length) {
    params.effective_status = JSON.stringify([...options.effectiveStatus]);
  }
  return params;
}

/** Lists one page of the account's ads (optionally filtered). */
export async function listAds(
  client: MetaApiClient,
  accountId: string,
  options: ListAdsOptions = {},
): Promise<Page<Ad>> {
  return client.getPage<Ad>(adsEdge(accountId), {
    fields: options.fields ?? AD_FIELDS,
    limit: options.limit ?? 25,
    ...adsParams(options),
    ...(options.after ? { after: options.after } : {}),
    ...(options.before ? { before: options.before } : {}),
  });
}

/** Lists one page of ads for a specific ad set. */
export async function listAdsByAdSet(
  client: MetaApiClient,
  adSetId: string,
  options: ListAdsOptions & { maxPages?: number } = {},
): Promise<Page<Ad>> {
  return client.getPage<Ad>(adsByAdSetEdge(adSetId), {
    fields: options.fields ?? AD_FIELDS,
    limit: options.limit ?? 25,
    ...adsParams(options),
    ...(options.after ? { after: options.after } : {}),
    ...(options.before ? { before: options.before } : {}),
  });
}

/** Lists one page of ads for a specific campaign. */
export async function listAdsByCampaign(
  client: MetaApiClient,
  campaignId: string,
  options: ListAdsOptions & { maxPages?: number } = {},
): Promise<Page<Ad>> {
  return client.getPage<Ad>(adsByCampaignEdge(campaignId), {
    fields: options.fields ?? AD_FIELDS,
    limit: options.limit ?? 25,
    ...adsParams(options),
    ...(options.after ? { after: options.after } : {}),
    ...(options.before ? { before: options.before } : {}),
  });
}

/** Collects every ad of the account across pages. */
export async function listAllAds(
  client: MetaApiClient,
  accountId: string,
  options: ListAdsOptions & { maxPages?: number } = {},
): Promise<Ad[]> {
  return client.collect<Ad>(
    adsEdge(accountId),
    {
      fields: options.fields ?? AD_FIELDS,
      limit: options.limit ?? 25,
      ...adsParams(options),
    },
    { maxPages: options.maxPages ?? 10 },
  );
}

/** Fetches a single ad by ID. */
export async function getAd(
  client: MetaApiClient,
  adId: string,
  fields?: readonly string[],
): Promise<Ad> {
  const result = await client.request<Ad>(adPath(adId), {
    searchParams: {
      fields: fields?.join(",") ?? AD_FIELDS.join(","),
    },
  });
  return result.data;
}

/** Extracts a simplified creative summary for display. */
export function summarizeCreative(creative: Ad["creative"]): CreativeSummary {
  if (!creative || typeof creative !== "object") {
    return {};
  }

  const c = creative as Record<string, unknown>;
  const summary: CreativeSummary = {};

  // Text fields
  summary.body = c.body as string | undefined;
  summary.headline = c.headline as string | undefined;
  summary.title = c.title as string | undefined;

  // Media URLs
  const image = c.image as { url?: string } | undefined;
  if (image?.url) {
    summary.image_url = image.url;
  }

  const video = c.video as { url?: string } | undefined;
  if (video?.url) {
    summary.video_url = video.url;
  }

  // Call to action
  const cta = c.call_to_action as
    { type?: string; value?: { link?: string } } | undefined;
  if (cta) {
    summary.call_to_action_type = cta.type;
    if (cta.value?.link) {
      summary.link_url = cta.value.link;
    }
  }

  // Link URL fallback
  if (!summary.link_url) {
    summary.link_url = c.link_url as string | undefined;
  }

  return summary;
}
