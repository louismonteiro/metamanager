import { describe, expect, it } from "vitest";

import { parseRateLimitHeaders, shouldBackOff } from "../rate-limit";

function headers(entries: Record<string, string>): Headers {
  return new Headers(entries);
}

describe("parseRateLimitHeaders", () => {
  it("returns an empty snapshot when no limiter header is present", () => {
    const snapshot = parseRateLimitHeaders(headers({}));

    expect(snapshot.appUsage).toBeUndefined();
    expect(snapshot.businessUseCase).toEqual([]);
    expect(snapshot.maxUtilisationPct).toBe(0);
  });

  it("parses X-App-Usage", () => {
    const snapshot = parseRateLimitHeaders(
      headers({
        "x-app-usage": JSON.stringify({
          call_count: 12,
          total_cputime: 5,
          total_time: 9,
        }),
      }),
    );

    expect(snapshot.appUsage).toEqual({
      callCount: 12,
      totalCputime: 5,
      totalTime: 9,
    });
    expect(snapshot.maxUtilisationPct).toBe(12);
  });

  it("flattens every business use case entry, keyed by business id", () => {
    const snapshot = parseRateLimitHeaders(
      headers({
        "x-business-use-case-usage": JSON.stringify({
          "1234567890": [
            {
              type: "ads_management",
              call_count: 40,
              total_cputime: 20,
              total_time: 30,
              estimated_time_to_regain_access: 0,
              ads_api_access_tier: "standard_access",
            },
            {
              type: "ads_insights",
              call_count: 95,
              total_cputime: 10,
              total_time: 12,
              estimated_time_to_regain_access: 7,
            },
          ],
        }),
      }),
    );

    expect(snapshot.businessUseCase).toHaveLength(2);
    expect(snapshot.businessUseCase[0]).toMatchObject({
      businessId: "1234567890",
      type: "ads_management",
      adsApiAccessTier: "standard_access",
    });
    expect(snapshot.businessUseCase[1]?.estimatedTimeToRegainAccess).toBe(7);
    expect(snapshot.maxUtilisationPct).toBe(95);
  });

  it("parses the insights throttle header", () => {
    const snapshot = parseRateLimitHeaders(
      headers({
        "x-fb-ads-insights-throttle": JSON.stringify({
          app_id_util_pct: 33.5,
          acc_id_util_pct: 71.25,
        }),
      }),
    );

    expect(snapshot.insightsThrottle).toEqual({
      appIdUtilPct: 33.5,
      accIdUtilPct: 71.25,
    });
    expect(snapshot.maxUtilisationPct).toBe(71.25);
  });

  it("reads Retry-After", () => {
    const snapshot = parseRateLimitHeaders(headers({ "retry-after": "120" }));
    expect(snapshot.retryAfterSeconds).toBe(120);
  });

  it("ignores a malformed header rather than failing the request", () => {
    const snapshot = parseRateLimitHeaders(
      headers({ "x-app-usage": "{not json" }),
    );

    expect(snapshot.appUsage).toBeUndefined();
    expect(snapshot.maxUtilisationPct).toBe(0);
  });
});

describe("shouldBackOff", () => {
  it("is false well below the threshold", () => {
    expect(shouldBackOff({ businessUseCase: [], maxUtilisationPct: 40 })).toBe(
      false,
    );
  });

  it("is true once utilisation reaches the warn threshold", () => {
    expect(shouldBackOff({ businessUseCase: [], maxUtilisationPct: 80 })).toBe(
      true,
    );
  });
});
