/**
 * Read-model of the monitoring dashboard.
 *
 * These shapes mirror what `GET /act_{id}`, `/campaigns`, `/adsets`, `/ads` and
 * `/insights` return once normalised, so wiring the real client in later is a
 * change of data source, not of contract. Every monetary field is in EUR.
 */

export type DeliveryStatus = "ACTIVE" | "PAUSED" | "ARCHIVED" | "IN_REVIEW";

export interface MetricSet {
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  /** Percentage, 0-100. */
  ctr: number;
  cpcEur: number;
  cpmEur: number;
  spendEur: number;
  /** Optimisation events attributed in the period. */
  results: number;
  costPerResultEur: number;
}

export interface AdNode {
  id: string;
  name: string;
  status: DeliveryStatus;
  metrics: MetricSet;
}

export interface AdSetNode {
  id: string;
  name: string;
  status: DeliveryStatus;
  optimizationGoal: string;
  dailyBudgetEur: number;
  metrics: MetricSet;
  ads: AdNode[];
}

export interface CampaignNode {
  id: string;
  name: string;
  status: DeliveryStatus;
  objective: string;
  dailyBudgetEur: number;
  metrics: MetricSet;
  adSets: AdSetNode[];
}

export interface AccountOverview {
  id: string;
  name: string;
  currency: string;
  accountStatus: string;
  spendEur: number;
  balanceEur: number;
  spendCapEur: number | null;
  periodLabel: string;
}

export interface LeadSourceRow {
  formId: string;
  formName: string;
  adName: string;
  leads: number;
  costPerLeadEur: number;
}

export interface ConversionRow {
  actionType: string;
  label: string;
  count: number;
  valueEur: number;
}

export interface DashboardSnapshot {
  account: AccountOverview;
  campaigns: CampaignNode[];
  leadSources: LeadSourceRow[];
  conversions: ConversionRow[];
  /** True while the dashboard is fed by fixtures instead of the Graph API. */
  isMock: boolean;
  generatedAt: string;
}
