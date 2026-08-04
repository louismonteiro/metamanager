import type {
  AdNode,
  AdSetNode,
  CampaignNode,
  DashboardSnapshot,
  MetricSet,
} from "./types";

/**
 * Fixtures for the monitoring dashboard.
 *
 * The dashboard renders against this snapshot until the Meta client is wired
 * in. Numbers are internally consistent — derived metrics are computed from
 * impressions, clicks, spend and results rather than typed by hand — so the
 * page exercises the same formatting paths real data will.
 */

interface MetricSeed {
  impressions: number;
  reach: number;
  clicks: number;
  spendEur: number;
  results: number;
}

function metrics(seed: MetricSeed): MetricSet {
  const { impressions, reach, clicks, spendEur, results } = seed;
  const round = (value: number, digits = 2) =>
    Number.parseFloat(value.toFixed(digits));

  return {
    impressions,
    reach,
    frequency: round(reach > 0 ? impressions / reach : 0),
    clicks,
    ctr: round(impressions > 0 ? (clicks / impressions) * 100 : 0),
    cpcEur: round(clicks > 0 ? spendEur / clicks : 0),
    cpmEur: round(impressions > 0 ? (spendEur / impressions) * 1000 : 0),
    spendEur: round(spendEur),
    results,
    costPerResultEur: round(results > 0 ? spendEur / results : 0),
  };
}

function sumMetrics(
  children: ReadonlyArray<{ metrics: MetricSet }>,
): MetricSet {
  const seed = children.reduce<MetricSeed>(
    (acc, child) => ({
      impressions: acc.impressions + child.metrics.impressions,
      reach: acc.reach + child.metrics.reach,
      clicks: acc.clicks + child.metrics.clicks,
      spendEur: acc.spendEur + child.metrics.spendEur,
      results: acc.results + child.metrics.results,
    }),
    { impressions: 0, reach: 0, clicks: 0, spendEur: 0, results: 0 },
  );
  return metrics(seed);
}

function ad(
  id: string,
  name: string,
  status: AdNode["status"],
  seed: MetricSeed,
): AdNode {
  return { id, name, status, metrics: metrics(seed) };
}

function adSet(
  id: string,
  name: string,
  status: AdSetNode["status"],
  optimizationGoal: string,
  dailyBudgetEur: number,
  ads: AdNode[],
): AdSetNode {
  return {
    id,
    name,
    status,
    optimizationGoal,
    dailyBudgetEur,
    metrics: sumMetrics(ads),
    ads,
  };
}

function campaign(
  id: string,
  name: string,
  status: CampaignNode["status"],
  objective: string,
  dailyBudgetEur: number,
  adSets: AdSetNode[],
): CampaignNode {
  return {
    id,
    name,
    status,
    objective,
    dailyBudgetEur,
    metrics: sumMetrics(adSets),
    adSets,
  };
}

const leadsCampaign = campaign(
  "23851234567890001",
  "Leads · Consultoria Q3",
  "ACTIVE",
  "OUTCOME_LEADS",
  50,
  [
    adSet(
      "23851234567890101",
      "Lisboa + Porto · 25-45 · Mulheres",
      "ACTIVE",
      "OFFSITE_CONVERSIONS",
      30,
      [
        ad("23851234567890201", "Vídeo depoimento · 30s", "ACTIVE", {
          impressions: 84_320,
          reach: 41_190,
          clicks: 1_912,
          spendEur: 1_284.4,
          results: 143,
        }),
        ad("23851234567890202", "Carrossel · 4 benefícios", "ACTIVE", {
          impressions: 61_045,
          reach: 33_870,
          clicks: 984,
          spendEur: 902.15,
          results: 71,
        }),
      ],
    ),
    adSet(
      "23851234567890102",
      "Retargeting · visitantes 30 dias",
      "ACTIVE",
      "LEAD_GENERATION",
      20,
      [
        ad("23851234567890203", "Imagem estática · oferta", "ACTIVE", {
          impressions: 29_710,
          reach: 12_440,
          clicks: 803,
          spendEur: 431.9,
          results: 58,
        }),
        ad("23851234567890204", "Imagem estática · urgência", "PAUSED", {
          impressions: 11_204,
          reach: 6_910,
          clicks: 142,
          spendEur: 208.6,
          results: 6,
        }),
      ],
    ),
  ],
);

const salesCampaign = campaign(
  "23851234567890002",
  "Vendas · Coleção Outono",
  "ACTIVE",
  "OUTCOME_SALES",
  80,
  [
    adSet(
      "23851234567890103",
      "Portugal · Interesses moda",
      "ACTIVE",
      "OFFSITE_CONVERSIONS",
      55,
      [
        ad("23851234567890205", "Reels · lookbook", "ACTIVE", {
          impressions: 132_890,
          reach: 58_310,
          clicks: 3_401,
          spendEur: 2_140.75,
          results: 187,
        }),
        ad("23851234567890206", "Coleção dinâmica · catálogo", "ACTIVE", {
          impressions: 97_450,
          reach: 44_020,
          clicks: 2_118,
          spendEur: 1_657.3,
          results: 152,
        }),
      ],
    ),
    adSet(
      "23851234567890104",
      "Espanha · teste geográfico",
      "PAUSED",
      "OFFSITE_CONVERSIONS",
      25,
      [
        ad("23851234567890207", "Reels · legendas ES", "PAUSED", {
          impressions: 18_640,
          reach: 11_205,
          clicks: 271,
          spendEur: 389.5,
          results: 9,
        }),
      ],
    ),
  ],
);

const awarenessCampaign = campaign(
  "23851234567890003",
  "Notoriedade · Marca institucional",
  "PAUSED",
  "OUTCOME_AWARENESS",
  15,
  [
    adSet("23851234567890105", "Amplo · 18-65+", "PAUSED", "REACH", 15, [
      ad("23851234567890208", "Vídeo institucional · 15s", "PAUSED", {
        impressions: 214_300,
        reach: 148_920,
        clicks: 1_072,
        spendEur: 612.4,
        results: 0,
      }),
    ]),
  ],
);

const campaigns: CampaignNode[] = [
  leadsCampaign,
  salesCampaign,
  awarenessCampaign,
];

/** Fixed timestamp so server and client renders agree and snapshots stay stable. */
const GENERATED_AT = "2026-08-01T09:00:00.000Z";

export const mockDashboardSnapshot: DashboardSnapshot = {
  account: {
    id: "act_123456789",
    name: "MetaManager · Conta principal",
    currency: "EUR",
    accountStatus: "ACTIVE",
    spendEur: Number.parseFloat(
      campaigns
        .reduce((total, item) => total + item.metrics.spendEur, 0)
        .toFixed(2),
    ),
    balanceEur: 1_420.0,
    spendCapEur: 12_000,
    periodLabel: "Últimos 30 dias",
  },
  campaigns,
  leadSources: [
    {
      formId: "1093847562109384",
      formName: "Pedido de consultoria",
      adName: "Vídeo depoimento · 30s",
      leads: 143,
      costPerLeadEur: 8.98,
    },
    {
      formId: "1093847562109384",
      formName: "Pedido de consultoria",
      adName: "Carrossel · 4 benefícios",
      leads: 71,
      costPerLeadEur: 12.71,
    },
    {
      formId: "1093847562109385",
      formName: "Newsletter · desconto",
      adName: "Imagem estática · oferta",
      leads: 58,
      costPerLeadEur: 7.45,
    },
  ],
  conversions: [
    {
      actionType: "lead",
      label: "Leads",
      count: 278,
      valueEur: 0,
    },
    {
      actionType: "offsite_conversion.fb_pixel_purchase",
      label: "Compras",
      count: 339,
      valueEur: 28_419.5,
    },
    {
      actionType: "offsite_conversion.fb_pixel_add_to_cart",
      label: "Adicionar ao carrinho",
      count: 1_204,
      valueEur: 0,
    },
    {
      actionType: "offsite_conversion.fb_pixel_initiate_checkout",
      label: "Checkout iniciado",
      count: 612,
      valueEur: 0,
    },
  ],
  isMock: true,
  generatedAt: GENERATED_AT,
};

/**
 * Loads the dashboard snapshot.
 *
 * Async on purpose: the signature does not change when this starts reading the
 * Meta API through a 15-minute cache, as the roadmap requires.
 */
export async function loadDashboardSnapshot(): Promise<DashboardSnapshot> {
  return mockDashboardSnapshot;
}
