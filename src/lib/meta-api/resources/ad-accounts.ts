import type { MetaApiClient } from "../client";
import type { Page, PaginationParams } from "../types";

/**
 * Ad account fields the product needs everywhere: identity, delivery status and
 * money. `currency` matters because the product presents every value in EUR.
 */
export const AD_ACCOUNT_FIELDS = [
  "id",
  "account_id",
  "name",
  "account_status",
  "currency",
  "timezone_name",
  "amount_spent",
  "balance",
  "spend_cap",
  "business",
] as const;

export interface AdAccountBusiness {
  id: string;
  name?: string;
}

/** `AdAccount` node — the container every ads write hangs off. */
export interface AdAccount {
  /** Prefixed form, e.g. `act_123456789`. */
  id: string;
  /** Numeric id without the `act_` prefix. */
  account_id?: string;
  name?: string;
  account_status?: number;
  currency?: string;
  timezone_name?: string;
  /** Minor units of `currency`, as a string. */
  amount_spent?: string;
  balance?: string;
  spend_cap?: string;
  business?: AdAccountBusiness;
}

/** `account_status` is numeric; these are the documented values. */
export const AD_ACCOUNT_STATUS: Record<number, string> = {
  1: "ACTIVE",
  2: "DISABLED",
  3: "UNSETTLED",
  7: "PENDING_RISK_REVIEW",
  8: "PENDING_SETTLEMENT",
  9: "IN_GRACE_PERIOD",
  100: "PENDING_CLOSURE",
  101: "CLOSED",
  201: "ANY_ACTIVE",
  202: "ANY_CLOSED",
};

export function adAccountStatusLabel(status: number | undefined): string {
  if (status === undefined) return "UNKNOWN";
  return AD_ACCOUNT_STATUS[status] ?? `UNKNOWN_${status}`;
}

export interface ListAdAccountsOptions extends PaginationParams {
  fields?: readonly string[];
  /**
   * Business Manager id. Defaults to the client's configured business.
   * When absent the listing falls back to the token owner's accounts.
   */
  businessId?: string;
}

/**
 * Resolves which edge to read.
 *
 * With a business id: `GET /{business_id}/owned_ad_accounts` — the accounts the
 * Business Manager owns. Without one: `GET /me/adaccounts` — the accounts the
 * token owner can access.
 */
export function adAccountsEdge(businessId: string | undefined): string {
  return businessId ? `${businessId}/owned_ad_accounts` : "me/adaccounts";
}

/** Lists the ad accounts reachable with the configured token. */
export async function listAdAccounts(
  client: MetaApiClient,
  options: ListAdAccountsOptions = {},
): Promise<Page<AdAccount>> {
  const businessId = options.businessId ?? client.config.businessId;

  return client.getPage<AdAccount>(adAccountsEdge(businessId), {
    fields: options.fields ?? AD_ACCOUNT_FIELDS,
    limit: options.limit ?? 25,
    ...(options.after ? { after: options.after } : {}),
    ...(options.before ? { before: options.before } : {}),
  });
}

/** Collects every reachable ad account across pages. */
export async function listAllAdAccounts(
  client: MetaApiClient,
  options: ListAdAccountsOptions & { maxPages?: number } = {},
): Promise<AdAccount[]> {
  const businessId = options.businessId ?? client.config.businessId;

  return client.collect<AdAccount>(
    adAccountsEdge(businessId),
    {
      fields: options.fields ?? AD_ACCOUNT_FIELDS,
      limit: options.limit ?? 25,
    },
    { maxPages: options.maxPages ?? 10 },
  );
}
