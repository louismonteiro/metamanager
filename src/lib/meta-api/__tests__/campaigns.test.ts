import { describe, expect, it, vi } from "vitest";

import { MetaApiClient, type FetchLike } from "../client";
import type { MetaApiConfig } from "../config";
import {
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
} from "../resources/campaigns";

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

describe("toAccountPath", () => {
  it("adds the act_ prefix when it is missing", () => {
    expect(toAccountPath("123456789")).toBe("act_123456789");
  });

  it("leaves an already prefixed id alone", () => {
    expect(toAccountPath("act_123456789")).toBe("act_123456789");
  });

  it("builds the campaigns and insights edges", () => {
    expect(campaignsEdge("123")).toBe("act_123/campaigns");
    expect(campaignInsightsEdge("act_123")).toBe("act_123/insights");
  });
});

describe("campaignStatusLabel", () => {
  it("labels the documented states in Portuguese", () => {
    expect(campaignStatusLabel("ACTIVE")).toBe("ativa");
    expect(campaignStatusLabel("PAUSED")).toBe("em pausa");
    expect(campaignStatusLabel("ARCHIVED")).toBe("arquivada");
  });

  it("does not invent a label for an unknown state", () => {
    expect(campaignStatusLabel("SOMETHING_NEW")).toBe("something_new");
    expect(campaignStatusLabel(undefined)).toBe("estado desconhecido");
  });
});

describe("money conversion", () => {
  it("reads budgets as minor units", () => {
    expect(minorUnitsToEur("5000")).toBe(50);
    expect(minorUnitsToEur("1")).toBe(0.01);
  });

  it("reads insights spend as major units", () => {
    expect(majorUnitsToEur("1250.5")).toBe(1250.5);
  });

  it("returns undefined rather than zero for a missing amount", () => {
    expect(minorUnitsToEur(undefined)).toBeUndefined();
    expect(minorUnitsToEur("")).toBeUndefined();
    expect(majorUnitsToEur(undefined)).toBeUndefined();
    expect(minorUnitsToEur("not-a-number")).toBeUndefined();
  });
});

describe("listCampaigns", () => {
  it("requests the account campaigns edge with the standard field set", async () => {
    const fetchImpl = fetchReturning({
      data: [
        {
          id: "23851",
          name: "Leads Janeiro",
          status: "ACTIVE",
          daily_budget: "5000",
        },
      ],
    });

    const page = await listCampaigns(clientWith(fetchImpl), "act_123");

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.pathname).toBe("/v26.0/act_123/campaigns");
    expect(url.searchParams.get("fields")).toBe(CAMPAIGN_FIELDS.join(","));
    expect(url.searchParams.get("limit")).toBe("25");
    expect(page.data[0]?.name).toBe("Leads Janeiro");
  });

  it("normalises an unprefixed account id", async () => {
    const fetchImpl = fetchReturning({ data: [] });

    await listCampaigns(clientWith(fetchImpl), "123");

    expect(new URL(String(fetchImpl.mock.calls[0]?.[0])).pathname).toBe(
      "/v26.0/act_123/campaigns",
    );
  });

  it("sends the effective_status filter as a JSON array", async () => {
    const fetchImpl = fetchReturning({ data: [] });

    await listCampaigns(clientWith(fetchImpl), "act_123", {
      effectiveStatus: ["ACTIVE"],
    });

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.searchParams.get("effective_status")).toBe('["ACTIVE"]');
  });

  it("forwards the pagination cursor and page size", async () => {
    const fetchImpl = fetchReturning({ data: [] });

    await listCampaigns(clientWith(fetchImpl), "act_123", {
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

    const page = await listCampaigns(clientWith(fetchImpl), "act_123");

    expect(page.hasNextPage).toBe(true);
    expect(page.nextCursor).toBe("next-cursor");
  });
});

describe("listAllCampaigns", () => {
  it("follows cursors until the last page", async () => {
    const fetchImpl = fetchReturning(
      {
        data: [{ id: "1" }],
        paging: { cursors: { after: "cursor-2" }, next: "https://next" },
      },
      { data: [{ id: "2" }] },
    );

    const campaigns = await listAllCampaigns(clientWith(fetchImpl), "act_123");

    expect(campaigns.map((campaign) => campaign.id)).toEqual(["1", "2"]);
    expect(
      new URL(String(fetchImpl.mock.calls[1]?.[0])).searchParams.get("after"),
    ).toBe("cursor-2");
  });
});

describe("listCampaignSpend", () => {
  it("reads the insights edge at campaign level", async () => {
    const fetchImpl = fetchReturning({
      data: [{ campaign_id: "23851", spend: "120.55" }],
    });

    await listCampaignSpend(clientWith(fetchImpl), "act_123");

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.pathname).toBe("/v26.0/act_123/insights");
    expect(url.searchParams.get("level")).toBe("campaign");
    expect(url.searchParams.get("fields")).toBe(
      CAMPAIGN_SPEND_FIELDS.join(","),
    );
    expect(url.searchParams.get("date_preset")).toBe("maximum");
  });

  it("honours an explicit window", async () => {
    const fetchImpl = fetchReturning({ data: [] });

    await listCampaignSpend(clientWith(fetchImpl), "act_123", {
      datePreset: "last_30d",
    });

    expect(
      new URL(String(fetchImpl.mock.calls[0]?.[0])).searchParams.get(
        "date_preset",
      ),
    ).toBe("last_30d");
  });
});

describe("indexSpendByCampaign", () => {
  it("indexes spend in euros by campaign id", () => {
    const index = indexSpendByCampaign([
      { campaign_id: "1", spend: "120.55" },
      { campaign_id: "2", spend: "0" },
    ]);

    expect(index.get("1")).toBe(120.55);
    expect(index.get("2")).toBe(0);
  });

  it("skips rows with no campaign or no spend", () => {
    const index = indexSpendByCampaign([
      { spend: "10" },
      { campaign_id: "3" },
      { campaign_id: "4", spend: "" },
    ]);

    expect(index.size).toBe(0);
  });
});
