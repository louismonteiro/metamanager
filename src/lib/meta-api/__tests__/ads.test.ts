import { describe, expect, it, vi } from "vitest";

import { MetaApiClient, type FetchLike } from "../client";
import type { MetaApiConfig } from "../config";
import {
  AD_FIELDS,
  adStatusLabel,
  listAds,
  listAdsByAdSet,
  listAdsByCampaign,
  listAllAds,
  summarizeCreative,
} from "../resources/ads";

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

describe("adStatusLabel", () => {
  it("labels the documented states in Portuguese", () => {
    expect(adStatusLabel("ACTIVE")).toBe("ativo");
    expect(adStatusLabel("PAUSED")).toBe("em pausa");
    expect(adStatusLabel("ARCHIVED")).toBe("arquivado");
  });

  it("does not invent a label for an unknown state", () => {
    expect(adStatusLabel("SOMETHING_NEW")).toBe("something_new");
    expect(adStatusLabel(undefined)).toBe("estado desconhecido");
  });
});

describe("summarizeCreative", () => {
  it("extracts text fields", () => {
    const creative = {
      body: "Texto principal do anúncio",
      headline: "Headline chamativa",
      title: "Título",
    };
    const summary = summarizeCreative(creative);
    expect(summary.body).toBe("Texto principal do anúncio");
    expect(summary.headline).toBe("Headline chamativa");
    expect(summary.title).toBe("Título");
  });

  it("extracts image URL", () => {
    const creative = {
      image: { url: "https://example.com/image.jpg" },
    };
    expect(summarizeCreative(creative).image_url).toBe(
      "https://example.com/image.jpg",
    );
  });

  it("extracts video URL", () => {
    const creative = {
      video: { url: "https://example.com/video.mp4" },
    };
    expect(summarizeCreative(creative).video_url).toBe(
      "https://example.com/video.mp4",
    );
  });

  it("extracts call to action", () => {
    const creative = {
      call_to_action: {
        type: "SHOP_NOW",
        value: { link: "https://example.com/shop" },
      },
    };
    const summary = summarizeCreative(creative);
    expect(summary.call_to_action_type).toBe("SHOP_NOW");
    expect(summary.link_url).toBe("https://example.com/shop");
  });

  it("extracts link_url as fallback", () => {
    const creative = {
      link_url: "https://example.com/landing",
    };
    expect(summarizeCreative(creative).link_url).toBe(
      "https://example.com/landing",
    );
  });

  it("returns empty object for null/undefined creative", () => {
    expect(summarizeCreative(null as unknown as undefined)).toEqual({});
    expect(summarizeCreative(undefined)).toEqual({});
  });
});

describe("listAds", () => {
  it("requests the account ads edge with the standard field set", async () => {
    const fetchImpl = fetchReturning({
      data: [
        {
          id: "23851001001",
          name: "Anúncio Janeiro",
          status: "ACTIVE",
          adset_id: "23851001",
        },
      ],
    });

    const page = await listAds(clientWith(fetchImpl), "act_123");

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.pathname).toBe("/v26.0/act_123/ads");
    expect(url.searchParams.get("fields")).toBe(AD_FIELDS.join(","));
    expect(url.searchParams.get("limit")).toBe("25");
    expect(page.data[0]?.name).toBe("Anúncio Janeiro");
  });

  it("normalises an unprefixed account id", async () => {
    const fetchImpl = fetchReturning({ data: [] });

    await listAds(clientWith(fetchImpl), "123");

    expect(new URL(String(fetchImpl.mock.calls[0]?.[0])).pathname).toBe(
      "/v26.0/act_123/ads",
    );
  });

  it("filters by adset_id when provided", async () => {
    const fetchImpl = fetchReturning({ data: [] });

    await listAds(clientWith(fetchImpl), "act_123", {
      adSetId: "456",
    });

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.searchParams.get("adset_id")).toBe("456");
  });

  it("filters by campaign_id when provided", async () => {
    const fetchImpl = fetchReturning({ data: [] });

    await listAds(clientWith(fetchImpl), "act_123", {
      campaignId: "789",
    });

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.searchParams.get("campaign_id")).toBe("789");
  });

  it("sends the effective_status filter as a JSON array", async () => {
    const fetchImpl = fetchReturning({ data: [] });

    await listAds(clientWith(fetchImpl), "act_123", {
      effectiveStatus: ["ACTIVE"],
    });

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.searchParams.get("effective_status")).toBe('["ACTIVE"]');
  });

  it("forwards the pagination cursor and page size", async () => {
    const fetchImpl = fetchReturning({ data: [] });

    await listAds(clientWith(fetchImpl), "act_123", {
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

    const page = await listAds(clientWith(fetchImpl), "act_123");

    expect(page.hasNextPage).toBe(true);
    expect(page.nextCursor).toBe("next-cursor");
  });
});

describe("listAdsByAdSet", () => {
  it("requests the ad set ads edge", async () => {
    const fetchImpl = fetchReturning({
      data: [{ id: "23851001001", name: "Anúncio 1" }],
    });

    const page = await listAdsByAdSet(clientWith(fetchImpl), "23851001");

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.pathname).toBe("/v26.0/23851001/ads");
    expect(page.data[0]?.name).toBe("Anúncio 1");
  });
});

describe("listAdsByCampaign", () => {
  it("requests the campaign ads edge", async () => {
    const fetchImpl = fetchReturning({
      data: [{ id: "23851001001", name: "Anúncio Campanha" }],
    });

    const page = await listAdsByCampaign(clientWith(fetchImpl), "23851");

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.pathname).toBe("/v26.0/23851/ads");
    expect(page.data[0]?.name).toBe("Anúncio Campanha");
  });
});

describe("listAllAds", () => {
  it("follows cursors until the last page", async () => {
    const fetchImpl = fetchReturning(
      {
        data: [{ id: "1" }],
        paging: { cursors: { after: "cursor-2" }, next: "https://next" },
      },
      { data: [{ id: "2" }] },
    );

    const ads = await listAllAds(clientWith(fetchImpl), "act_123");

    expect(ads.map((ad) => ad.id)).toEqual(["1", "2"]);
    expect(
      new URL(String(fetchImpl.mock.calls[1]?.[0])).searchParams.get("after"),
    ).toBe("cursor-2");
  });
});
