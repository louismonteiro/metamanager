import { describe, expect, it, vi } from "vitest";

import { MetaApiClient, type FetchLike } from "../client";
import type { MetaApiConfig } from "../config";
import {
  ADSET_FIELDS,
  adSetStatusLabel,
  formatAdSetBudget,
  listAdSets,
  listAllAdSets,
  minorUnitsToEur,
  summarizeTargeting,
  type AdSet,
} from "../resources/adsets";

const baseConfig: MetaApiConfig = {
  accessToken: "test-token",
  version: "v26.0",
  host: "https://graph.facebook.com",
  timeoutMs: 5_000,
};

function fetchReturning(
  ...bodies: unknown[]
): ReturnType<typeof vi.fn<FetchLike>> {
  const impl = vi.fn<FetchLike>();
  for (const body of bodies) {
    impl.mockResolvedValueOnce(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }
  return impl;
}

function clientWith(fetchImpl: FetchLike): MetaApiClient {
  return new MetaApiClient(baseConfig, { fetchImpl });
}

describe("adSetStatusLabel", () => {
  it("labels the documented states in Portuguese", () => {
    expect(adSetStatusLabel("ACTIVE")).toBe("ativo");
    expect(adSetStatusLabel("PAUSED")).toBe("em pausa");
    expect(adSetStatusLabel("ARCHIVED")).toBe("arquivado");
  });

  it("does not invent a label for an unknown state", () => {
    expect(adSetStatusLabel("SOMETHING_NEW")).toBe("something_new");
    expect(adSetStatusLabel(undefined)).toBe("estado desconhecido");
  });
});

describe("money conversion", () => {
  it("reads budgets as minor units", () => {
    expect(minorUnitsToEur("5000")).toBe(50);
    expect(minorUnitsToEur("1")).toBe(0.01);
  });

  it("returns undefined rather than zero for a missing amount", () => {
    expect(minorUnitsToEur(undefined)).toBeUndefined();
    expect(minorUnitsToEur("")).toBeUndefined();
    expect(minorUnitsToEur("not-a-number")).toBeUndefined();
  });
});

describe("formatAdSetBudget", () => {
  it("formats a daily budget", () => {
    const adSet: AdSet = { id: "1", daily_budget: "5000" };
    expect(formatAdSetBudget(adSet)).toEqual({
      daily: 50,
      lifetime: undefined,
      label: "diário",
    });
  });

  it("formats a lifetime budget", () => {
    const adSet: AdSet = { id: "1", lifetime_budget: "10000" };
    expect(formatAdSetBudget(adSet)).toEqual({
      daily: undefined,
      lifetime: 100,
      label: "vitalício",
    });
  });

  it("returns undefined when no budget is set", () => {
    const adSet: AdSet = { id: "1" };
    expect(formatAdSetBudget(adSet)).toEqual({
      daily: undefined,
      lifetime: undefined,
      label: undefined,
    });
  });
});

describe("summarizeTargeting", () => {
  it("extracts geo locations", () => {
    const targeting = {
      geo_locations: {
        custom_locations: [{ name: "Lisboa" }, { name: "Porto" }],
      },
    };
    expect(summarizeTargeting(targeting).geo_locations).toBe("Lisboa, Porto");
  });

  it("extracts age range", () => {
    const targeting = { age_min: 25, age_max: 45 };
    const summary = summarizeTargeting(targeting);
    expect(summary.age_min).toBe(25);
    expect(summary.age_max).toBe(45);
  });

  it("extracts genders", () => {
    const targeting = { genders: [1, 2] };
    expect(summarizeTargeting(targeting).genders).toEqual([1, 2]);
  });

  it("extracts interests", () => {
    const targeting = {
      interests: [{ name: "Tecnologia" }, { name: "Marketing" }],
    };
    expect(summarizeTargeting(targeting).interests).toEqual([
      "Tecnologia",
      "Marketing",
    ]);
  });

  it("returns empty object for null/undefined targeting", () => {
    expect(summarizeTargeting(null as unknown as undefined)).toEqual({});
    expect(summarizeTargeting(undefined)).toEqual({});
  });
});

describe("listAdSets", () => {
  it("requests the account adsets edge with the standard field set", async () => {
    const fetchImpl = fetchReturning({
      data: [
        {
          id: "23851001",
          name: "Ad Set Janeiro",
          status: "ACTIVE",
          daily_budget: "5000",
        },
      ],
    });

    const page = await listAdSets(clientWith(fetchImpl), "act_123");

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.pathname).toBe("/v26.0/act_123/adsets");
    expect(url.searchParams.get("fields")).toBe(ADSET_FIELDS.join(","));
    expect(url.searchParams.get("limit")).toBe("25");
    expect(page.data[0]?.name).toBe("Ad Set Janeiro");
  });

  it("normalises an unprefixed account id", async () => {
    const fetchImpl = fetchReturning({ data: [] });

    await listAdSets(clientWith(fetchImpl), "123");

    expect(new URL(String(fetchImpl.mock.calls[0]?.[0])).pathname).toBe(
      "/v26.0/act_123/adsets",
    );
  });

  it("filters by campaign_id when provided", async () => {
    const fetchImpl = fetchReturning({ data: [] });

    await listAdSets(clientWith(fetchImpl), "act_123", {
      campaignId: "456",
    });

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.searchParams.get("campaign_id")).toBe("456");
  });

  it("sends the effective_status filter as a JSON array", async () => {
    const fetchImpl = fetchReturning({ data: [] });

    await listAdSets(clientWith(fetchImpl), "act_123", {
      effectiveStatus: ["ACTIVE"],
    });

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.searchParams.get("effective_status")).toBe('["ACTIVE"]');
  });

  it("forwards the pagination cursor and page size", async () => {
    const fetchImpl = fetchReturning({ data: [] });

    await listAdSets(clientWith(fetchImpl), "act_123", {
      after: "cursor-abc",
      limit: 5,
    });

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.searchParams.get("after")).toBe("cursor-abc");
    expect(url.searchParams.get("limit")).toBe("5");
  });

  it("reports whether more pages exist", async () => {
    const fetchImpl = fetchReturning({
      data: [{ id: "1" }],
      paging: { cursors: { after: "next-cursor" }, next: "https://next" },
    });

    const page = await listAdSets(clientWith(fetchImpl), "act_123");

    expect(page.hasNextPage).toBe(true);
    expect(page.nextCursor).toBe("next-cursor");
  });
});

describe("listAllAdSets", () => {
  it("follows cursors until the last page", async () => {
    const fetchImpl = fetchReturning(
      {
        data: [{ id: "1" }],
        paging: { cursors: { after: "cursor-2" }, next: "https://next" },
      },
      { data: [{ id: "2" }] },
    );

    const adSets = await listAllAdSets(clientWith(fetchImpl), "act_123");

    expect(adSets.map((adSet) => adSet.id)).toEqual(["1", "2"]);
    expect(
      new URL(String(fetchImpl.mock.calls[1]?.[0])).searchParams.get("after"),
    ).toBe("cursor-2");
  });
});
