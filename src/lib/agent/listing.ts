import {
  campaignStatusLabel,
  indexSpendByCampaign,
  listAdAccounts,
  listCampaignSpend,
  listCampaigns,
  MetaApiClient,
  MetaApiError,
  minorUnitsToEur,
  readMetaApiConfig,
  type Campaign,
  type MetaApiClientOptions,
  type MetaApiEnv,
} from "@/lib/meta-api";
import type { CampaignListing, CampaignSummary } from "./types";

/**
 * Executes the read side of the agent: answering "que campanhas tenho?" with
 * the account's real campaigns.
 *
 * Runs server-side only. The token never leaves this layer — it is read from
 * the environment, used in the `Authorization` header by the client, and only
 * normalised campaign data crosses back to the chat.
 */

/** Page size for the chat listing: enough to answer, short enough to read. */
export const CAMPAIGN_LISTING_LIMIT = 25;

export interface FetchCampaignListingOptions {
  limit?: number;
  /** Ad account to read. Defaults to the first account the token reaches. */
  accountId?: string;
}

/** Normalises a Graph campaign node for presentation. Amounts become euros. */
export function toCampaignSummary(
  campaign: Campaign,
  spendByCampaign: ReadonlyMap<string, number> = new Map(),
): CampaignSummary {
  const status = campaign.status ?? campaign.effective_status ?? "";
  const dailyBudgetEur = minorUnitsToEur(campaign.daily_budget);
  const lifetimeBudgetEur = minorUnitsToEur(campaign.lifetime_budget);
  const spendEur = spendByCampaign.get(campaign.id);

  return {
    id: campaign.id,
    name: campaign.name ?? campaign.id,
    status,
    statusLabel: campaignStatusLabel(status || undefined),
    // Only worth surfacing when delivery disagrees with the configured state.
    ...(campaign.effective_status && campaign.effective_status !== status
      ? { effectiveStatus: campaign.effective_status }
      : {}),
    ...(campaign.objective ? { objective: campaign.objective } : {}),
    // A campaign without a budget is not an error: budgets live on the ad sets
    // unless the campaign uses Advantage campaign budget.
    ...(dailyBudgetEur !== undefined ? { dailyBudgetEur } : {}),
    ...(lifetimeBudgetEur !== undefined ? { lifetimeBudgetEur } : {}),
    ...(spendEur !== undefined ? { spendEur } : {}),
  };
}

/**
 * Reads spend per campaign, best-effort.
 *
 * Insights have their own throttling budget and can be unavailable while the
 * object edges answer fine, so a failure here degrades the answer instead of
 * failing it.
 */
async function readSpend(
  client: MetaApiClient,
  accountId: string,
): Promise<{ byCampaign: Map<string, number>; unavailable: boolean }> {
  try {
    const page = await listCampaignSpend(client, accountId);
    return { byCampaign: indexSpendByCampaign(page.data), unavailable: false };
  } catch {
    return { byCampaign: new Map(), unavailable: true };
  }
}

function describeFailure(cause: unknown): CampaignListing {
  if (cause instanceof MetaApiError) {
    return {
      status: "error",
      message: cause.message,
      ...(cause.code !== undefined ? { code: cause.code } : {}),
    };
  }
  return {
    status: "error",
    message: cause instanceof Error ? cause.message : String(cause),
  };
}

/**
 * Validates the account id format.
 *
 * Accepts `act_<digits>` or just `<digits>`. Returns an error result with a
 * Portuguese message explaining the expected format when the id is invalid.
 */
function validateAccountId(
  accountId: string,
): { ok: true } | { ok: false; error: string } {
  const trimmed = accountId.trim();
  const digitsOnly = trimmed.replace(/^act_/, "");
  if (/^\d+$/.test(digitsOnly) && digitsOnly.length > 0) {
    return { ok: true };
  }
  return {
    ok: false,
    error:
      "Formato de conta inválido. O esperado é `act_<números>` ou apenas `<números>` (ex.: `act_123456789`).",
  };
}

/**
 * Fetches the campaigns of the account the configured token reaches.
 *
 * `env` and `clientOptions` are injected the same way the health check takes
 * them, so tests drive the whole path without touching the network.
 */
export async function fetchCampaignListing(
  env: MetaApiEnv = process.env,
  clientOptions: MetaApiClientOptions = {},
  options: FetchCampaignListingOptions = {},
): Promise<CampaignListing> {
  const configResult = readMetaApiConfig(env);
  if (!configResult.ok) {
    return { status: "unconfigured", reason: configResult.reason };
  }

  const client = new MetaApiClient(configResult.config, clientOptions);

  try {
    let accountId = options.accountId;
    let accountName = accountId ?? "";

    if (!accountId) {
      const accounts = await listAdAccounts(client, { limit: 1 });
      const account = accounts.data[0];
      if (!account) {
        return {
          status: "no_account",
          reason:
            "O token não alcança nenhuma conta de anúncios. Confirma as permissões (ads_read) e o Business Manager.",
        };
      }
      accountId = account.id;
      accountName = account.name ?? account.id;
    } else {
      const validation = validateAccountId(accountId);
      if (!validation.ok) {
        return { status: "error", message: validation.error };
      }
    }

    const page = await listCampaigns(client, accountId, {
      limit: options.limit ?? CAMPAIGN_LISTING_LIMIT,
    });

    const spend = await readSpend(client, accountId);

    return {
      status: "ok",
      accountId,
      accountName: accountName || accountId,
      campaigns: page.data.map((campaign) =>
        toCampaignSummary(campaign, spend.byCampaign),
      ),
      totalCount: page.data.length,
      hasMore: page.hasNextPage,
      spendUnavailable: spend.unavailable,
    };
  } catch (cause) {
    return describeFailure(cause);
  }
}
