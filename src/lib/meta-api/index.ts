export {
  buildGraphUrl,
  META_API_DEFAULT_TIMEOUT_MS,
  META_API_VERSION,
  META_GRAPH_HOST,
  readMetaApiConfig,
  requireMetaApiConfig,
  type MetaApiConfig,
  type MetaApiConfigResult,
  type MetaApiEnv,
} from "./config";

export {
  MetaApiClient,
  type FetchLike,
  type MetaApiClientOptions,
  type RequestOptions,
} from "./client";

export {
  createMetaApiError,
  isAuthCode,
  isRateLimitCode,
  isValidationCode,
  MetaApiError,
  MetaAuthError,
  MetaConfigError,
  MetaRateLimitError,
  MetaTransportError,
  MetaValidationError,
  type GraphErrorPayload,
  type MetaApiErrorDetails,
} from "./errors";

export {
  parseRateLimitHeaders,
  RATE_LIMIT_WARN_PCT,
  shouldBackOff,
  type AppUsage,
  type BusinessUseCaseUsage,
  type InsightsThrottle,
  type RateLimitSnapshot,
} from "./rate-limit";

export type {
  GraphListResponse,
  GraphPaging,
  MetaApiResult,
  Page,
  PaginationParams,
  QueryParams,
  QueryValue,
} from "./types";

export {
  AD_ACCOUNT_FIELDS,
  AD_ACCOUNT_STATUS,
  adAccountStatusLabel,
  adAccountsEdge,
  listAdAccounts,
  listAllAdAccounts,
  type AdAccount,
  type AdAccountBusiness,
  type ListAdAccountsOptions,
} from "./resources/ad-accounts";

export {
  ADSET_FIELDS,
  ADSET_STATUS,
  adSetStatusLabel,
  adSetsEdge,
  adSetPath,
  listAdSets,
  listAllAdSets,
  getAdSet,
  summarizeTargeting,
  formatAdSetBudget,
  type AdSet,
  type AdSetStatus,
  type ListAdSetsOptions,
  type TargetingSummary,
} from "./resources/adsets";

export {
  AD_FIELDS,
  AD_STATUS,
  adStatusLabel,
  adsEdge,
  adsByAdSetEdge,
  adsByCampaignEdge,
  adPath,
  listAds,
  listAdsByAdSet,
  listAdsByCampaign,
  listAllAds,
  getAd,
  summarizeCreative,
  type Ad,
  type AdStatus,
  type CreativeSummary,
  type ListAdsOptions,
} from "./resources/ads";

export {
  CAMPAIGN_FIELDS,
  CAMPAIGN_SPEND_FIELDS,
  campaignInsightsEdge,
  campaignStatusLabel,
  campaignsEdge,
  indexSpendByCampaign,
  listAllCampaigns,
  listCampaignSpend,
  listCampaigns,
  majorUnitsToEur,
  minorUnitsToEur,
  toAccountPath,
  type Campaign,
  type CampaignSpendRow,
  type CampaignStatus,
  type ListCampaignSpendOptions,
  type ListCampaignsOptions,
} from "./resources/campaigns";
