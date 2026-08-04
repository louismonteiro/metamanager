/**
 * Rate-limit header parsing.
 *
 * Three independent limiter families apply to the Marketing API. Read the
 * headers; do not infer limits from call counts alone.
 * @see https://developers.facebook.com/docs/graph-api/overview/rate-limiting
 */

/** `X-App-Usage` — platform limits on app/user tokens. Percentages 0-100. */
export interface AppUsage {
  callCount: number;
  totalCputime: number;
  totalTime: number;
}

/** One entry of `X-Business-Use-Case-Usage` (up to 32 objects per call). */
export interface BusinessUseCaseUsage {
  businessId: string;
  type?: string;
  callCount: number;
  totalCputime: number;
  totalTime: number;
  /** Minutes until throttling lifts. */
  estimatedTimeToRegainAccess?: number;
  adsApiAccessTier?: string;
}

/** `x-fb-ads-insights-throttle` — per-app and per-ad-account insights load. */
export interface InsightsThrottle {
  appIdUtilPct: number;
  accIdUtilPct: number;
}

export interface RateLimitSnapshot {
  appUsage?: AppUsage;
  businessUseCase: BusinessUseCaseUsage[];
  insightsThrottle?: InsightsThrottle;
  retryAfterSeconds?: number;
  /** Highest utilisation percentage seen across every limiter in this response. */
  maxUtilisationPct: number;
}

/** Utilisation above this is where back-off should start. */
export const RATE_LIMIT_WARN_PCT = 80;

function toNumber(value: unknown): number {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : 0;
}

function parseJsonHeader(raw: string | null): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    // Headers are advisory; a malformed one must never break the request.
    return undefined;
  }
}

function parseAppUsage(raw: string | null): AppUsage | undefined {
  const parsed = parseJsonHeader(raw);
  if (!parsed || typeof parsed !== "object") return undefined;
  const record = parsed as Record<string, unknown>;
  return {
    callCount: toNumber(record.call_count),
    totalCputime: toNumber(record.total_cputime),
    totalTime: toNumber(record.total_time),
  };
}

function parseBusinessUseCase(raw: string | null): BusinessUseCaseUsage[] {
  const parsed = parseJsonHeader(raw);
  if (!parsed || typeof parsed !== "object") return [];

  const entries: BusinessUseCaseUsage[] = [];
  for (const [businessId, value] of Object.entries(
    parsed as Record<string, unknown>,
  )) {
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      entries.push({
        businessId,
        ...(typeof record.type === "string" ? { type: record.type } : {}),
        callCount: toNumber(record.call_count),
        totalCputime: toNumber(record.total_cputime),
        totalTime: toNumber(record.total_time),
        ...(record.estimated_time_to_regain_access !== undefined
          ? {
              estimatedTimeToRegainAccess: toNumber(
                record.estimated_time_to_regain_access,
              ),
            }
          : {}),
        ...(typeof record.ads_api_access_tier === "string"
          ? { adsApiAccessTier: record.ads_api_access_tier }
          : {}),
      });
    }
  }
  return entries;
}

function parseInsightsThrottle(
  raw: string | null,
): InsightsThrottle | undefined {
  const parsed = parseJsonHeader(raw);
  if (!parsed || typeof parsed !== "object") return undefined;
  const record = parsed as Record<string, unknown>;
  return {
    appIdUtilPct: toNumber(record.app_id_util_pct),
    accIdUtilPct: toNumber(record.acc_id_util_pct),
  };
}

function parseRetryAfter(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const seconds = Number.parseInt(raw, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

/** Extracts every rate-limit signal Meta puts on a response. */
export function parseRateLimitHeaders(headers: Headers): RateLimitSnapshot {
  const appUsage = parseAppUsage(headers.get("x-app-usage"));
  const businessUseCase = parseBusinessUseCase(
    headers.get("x-business-use-case-usage"),
  );
  const insightsThrottle = parseInsightsThrottle(
    headers.get("x-fb-ads-insights-throttle"),
  );
  const retryAfterSeconds = parseRetryAfter(headers.get("retry-after"));

  const utilisations: number[] = [];
  if (appUsage) {
    utilisations.push(
      appUsage.callCount,
      appUsage.totalCputime,
      appUsage.totalTime,
    );
  }
  for (const entry of businessUseCase) {
    utilisations.push(entry.callCount, entry.totalCputime, entry.totalTime);
  }
  if (insightsThrottle) {
    utilisations.push(
      insightsThrottle.appIdUtilPct,
      insightsThrottle.accIdUtilPct,
    );
  }

  return {
    ...(appUsage ? { appUsage } : {}),
    businessUseCase,
    ...(insightsThrottle ? { insightsThrottle } : {}),
    ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
    maxUtilisationPct: utilisations.length > 0 ? Math.max(...utilisations) : 0,
  };
}

/** True when utilisation is close enough to 100 that callers should back off. */
export function shouldBackOff(
  snapshot: RateLimitSnapshot,
  warnPct: number = RATE_LIMIT_WARN_PCT,
): boolean {
  return snapshot.maxUtilisationPct >= warnPct;
}
