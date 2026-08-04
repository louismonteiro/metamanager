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
