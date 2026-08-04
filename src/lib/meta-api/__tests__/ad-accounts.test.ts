import { describe, expect, it, vi } from "vitest";

import { MetaApiClient, type FetchLike } from "../client";
import type { MetaApiConfig } from "../config";
import {
  AD_ACCOUNT_FIELDS,
  adAccountStatusLabel,
  adAccountsEdge,
  listAdAccounts,
} from "../resources/ad-accounts";

const baseConfig: MetaApiConfig = {
  accessToken: "test-token",
  version: "v26.0",
  host: "https://graph.facebook.com",
  timeoutMs: 5_000,
};

function fetchReturning(body: unknown): ReturnType<typeof vi.fn<FetchLike>> {
  return vi.fn<FetchLike>().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
}

describe("adAccountsEdge", () => {
  it("uses the personal edge without a business id", () => {
    expect(adAccountsEdge(undefined)).toBe("me/adaccounts");
  });

  it("uses the owned-accounts edge with a business id", () => {
    expect(adAccountsEdge("987")).toBe("987/owned_ad_accounts");
  });
});

describe("adAccountStatusLabel", () => {
  it("maps documented numeric statuses", () => {
    expect(adAccountStatusLabel(1)).toBe("ACTIVE");
    expect(adAccountStatusLabel(2)).toBe("DISABLED");
  });

  it("does not pretend to know an undocumented status", () => {
    expect(adAccountStatusLabel(42)).toBe("UNKNOWN_42");
    expect(adAccountStatusLabel(undefined)).toBe("UNKNOWN");
  });
});

describe("listAdAccounts", () => {
  it("requests /me/adaccounts with the standard field set", async () => {
    const fetchImpl = fetchReturning({
      data: [
        {
          id: "act_123456789",
          account_id: "123456789",
          name: "Conta principal",
          currency: "EUR",
          account_status: 1,
        },
      ],
    });

    const page = await listAdAccounts(
      new MetaApiClient(baseConfig, { fetchImpl }),
    );

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.pathname).toBe("/v26.0/me/adaccounts");
    expect(url.searchParams.get("fields")).toBe(AD_ACCOUNT_FIELDS.join(","));
    expect(url.searchParams.get("limit")).toBe("25");
    expect(page.data[0]?.currency).toBe("EUR");
  });

  it("reads owned accounts when the client has a business id", async () => {
    const fetchImpl = fetchReturning({ data: [] });

    await listAdAccounts(
      new MetaApiClient(
        { ...baseConfig, businessId: "987654321" },
        { fetchImpl },
      ),
    );

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.pathname).toBe("/v26.0/987654321/owned_ad_accounts");
  });

  it("lets an explicit business id override the configured one", async () => {
    const fetchImpl = fetchReturning({ data: [] });

    await listAdAccounts(
      new MetaApiClient(
        { ...baseConfig, businessId: "987654321" },
        { fetchImpl },
      ),
      { businessId: "111222333" },
    );

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.pathname).toBe("/v26.0/111222333/owned_ad_accounts");
  });

  it("forwards the pagination cursor", async () => {
    const fetchImpl = fetchReturning({ data: [] });

    await listAdAccounts(new MetaApiClient(baseConfig, { fetchImpl }), {
      after: "cursor-abc",
      limit: 5,
    });

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.searchParams.get("after")).toBe("cursor-abc");
    expect(url.searchParams.get("limit")).toBe("5");
  });
});
