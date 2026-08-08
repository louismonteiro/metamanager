import {
  listAllCampaigns,
  listAllAdSets,
  listAllAds,
  listCampaignSpend,
  indexSpendByCampaign,
  MetaApiClient,
  readMetaApiConfig,
  minorUnitsToEur,
  type AdSet as ApiAdSet,
  type Ad as ApiAd,
} from "@/lib/meta-api";
import type {
  CampaignNode,
  AdSetNode,
  AdNode,
  DashboardSnapshot,
  MetricSet,
} from "./types";

/**
 * Loads the real dashboard snapshot from the Meta Marketing API.
 *
 * Returns null when the API is unconfigured or any read fails — the page falls
 * back to fixtures in that case.
 */
export async function loadRealDashboardSnapshot(): Promise<DashboardSnapshot | null> {
  const configResult = readMetaApiConfig(process.env);
  if (!configResult.ok) return null;

  const client = new MetaApiClient(configResult.config);

  try {
    // 1. Load account info
    const accounts = await client.collect<{
      id: string;
      name?: string;
      currency?: string;
      account_status?: string;
      amount_spent?: string;
      balance?: string;
      spend_cap?: string | null;
    }>("/me/adaccounts", {
      fields: [
        "id",
        "name",
        "currency",
        "account_status",
        "amount_spent",
        "balance",
        "spend_cap",
      ],
      limit: 1,
    });

    const account = accounts[0];
    if (!account) return null;

    // 2. Load campaigns
    const campaigns = await listAllCampaigns(client, account.id);

    // 3. Load ad sets for each campaign
    const adSetsByCampaign = new Map<string, ApiAdSet[]>();
    for (const campaign of campaigns) {
      const adSets = await listAllAdSets(client, account.id, {
        campaignId: campaign.id,
      });
      adSetsByCampaign.set(campaign.id, adSets);
    }

    // 4. Load ads for each ad set
    const adsByAdSet = new Map<string, ApiAd[]>();
    for (const [, adSets] of adSetsByCampaign) {
      for (const adSet of adSets) {
        const ads = await listAllAds(client, account.id, {
          adSetId: adSet.id,
        });
        adsByAdSet.set(adSet.id, ads);
      }
    }

    // 5. Load spend data
    const spendPage = await listCampaignSpend(client, account.id);
    const spendByCampaign = indexSpendByCampaign(spendPage.data);

    // 6. Build the snapshot
    const campaignNodes: CampaignNode[] = campaigns.map((campaign) => {
      const adSetNodes: AdSetNode[] = (
        adSetsByCampaign.get(campaign.id) || []
      ).map((adSet) => {
        const adNodes: AdNode[] = (adsByAdSet.get(adSet.id) || []).map(
          (ad) => ({
            id: ad.id,
            name: ad.name ?? ad.id,
            status: (ad.status ?? "IN_REVIEW") as DeliveryStatus,
            metrics: emptyMetrics(),
          }),
        );

        return {
          id: adSet.id,
          name: adSet.name ?? adSet.id,
          status: (adSet.status ?? "IN_REVIEW") as DeliveryStatus,
          optimizationGoal: adSet.optimization_goal ?? "UNKNOWN",
          dailyBudgetEur: minorUnitsToEur(adSet.daily_budget) ?? 0,
          metrics: sumMetrics(adNodes),
          ads: adNodes,
        };
      });

      const campaignSpend = spendByCampaign.get(campaign.id) ?? 0;

      return {
        id: campaign.id,
        name: campaign.name ?? campaign.id,
        status: (campaign.status ?? "IN_REVIEW") as DeliveryStatus,
        objective: campaign.objective ?? "UNKNOWN",
        dailyBudgetEur: minorUnitsToEur(campaign.daily_budget) ?? 0,
        metrics: {
          ...sumMetrics(adSetNodes),
          spendEur: campaignSpend,
        },
        adSets: adSetNodes,
      };
    });

    const totalSpend = campaignNodes.reduce(
      (sum, c) => sum + c.metrics.spendEur,
      0,
    );

    return {
      account: {
        id: account.id,
        name: account.name ?? account.id,
        currency: account.currency ?? "EUR",
        accountStatus: account.account_status ?? "UNKNOWN",
        spendEur: totalSpend,
        balanceEur: Number.parseFloat(account.balance ?? "0"),
        spendCapEur: account.spend_cap
          ? Number.parseFloat(account.spend_cap)
          : null,
        periodLabel: "Últimos 30 dias",
      },
      campaigns: campaignNodes,
      leadSources: [],
      conversions: [],
      isMock: false,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function emptyMetrics(): MetricSet {
  return {
    impressions: 0,
    reach: 0,
    frequency: 0,
    clicks: 0,
    ctr: 0,
    cpcEur: 0,
    cpmEur: 0,
    spendEur: 0,
    results: 0,
    costPerResultEur: 0,
  };
}

function sumMetrics(
  children: ReadonlyArray<{ metrics: MetricSet }>,
): MetricSet {
  const totals = children.reduce(
    (acc, child) => ({
      impressions: acc.impressions + child.metrics.impressions,
      reach: acc.reach + child.metrics.reach,
      clicks: acc.clicks + child.metrics.clicks,
      spendEur: acc.spendEur + child.metrics.spendEur,
      results: acc.results + child.metrics.results,
    }),
    { impressions: 0, reach: 0, clicks: 0, spendEur: 0, results: 0 },
  );

  const { impressions, reach, clicks, spendEur, results } = totals;

  return {
    ...totals,
    frequency: reach > 0 ? impressions / reach : 0,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpcEur: clicks > 0 ? spendEur / clicks : 0,
    cpmEur: impressions > 0 ? (spendEur / impressions) * 1000 : 0,
    costPerResultEur: results > 0 ? spendEur / results : 0,
  };
}

type DeliveryStatus = "ACTIVE" | "PAUSED" | "ARCHIVED" | "IN_REVIEW";
