import { describe, expect, it } from "vitest";

import { loadDashboardSnapshot, mockDashboardSnapshot } from "../mock-data";

const { campaigns, account } = mockDashboardSnapshot;

describe("mock dashboard snapshot", () => {
  it("covers every level the dashboard renders", () => {
    expect(campaigns.length).toBeGreaterThan(0);
    expect(campaigns.some((campaign) => campaign.adSets.length > 0)).toBe(true);
    expect(
      campaigns.some((campaign) =>
        campaign.adSets.some((adSet) => adSet.ads.length > 0),
      ),
    ).toBe(true);
  });

  it("is labelled as mock so the UI can say so", () => {
    expect(mockDashboardSnapshot.isMock).toBe(true);
  });

  it("presents the account in euros", () => {
    expect(account.currency).toBe("EUR");
  });

  it("rolls campaign spend up from its ads", () => {
    for (const campaign of campaigns) {
      const fromAds = campaign.adSets
        .flatMap((adSet) => adSet.ads)
        .reduce((sum, ad) => sum + ad.metrics.spendEur, 0);

      expect(campaign.metrics.spendEur).toBeCloseTo(fromAds, 2);
    }
  });

  it("derives CTR from clicks and impressions", () => {
    for (const ad of campaigns.flatMap((campaign) =>
      campaign.adSets.flatMap((adSet) => adSet.ads),
    )) {
      const expected = (ad.metrics.clicks / ad.metrics.impressions) * 100;
      expect(ad.metrics.ctr).toBeCloseTo(expected, 2);
    }
  });

  it("derives cost per result only where there are results", () => {
    for (const ad of campaigns.flatMap((campaign) =>
      campaign.adSets.flatMap((adSet) => adSet.ads),
    )) {
      if (ad.metrics.results === 0) {
        expect(ad.metrics.costPerResultEur).toBe(0);
      } else {
        expect(ad.metrics.costPerResultEur).toBeCloseTo(
          ad.metrics.spendEur / ad.metrics.results,
          2,
        );
      }
    }
  });

  it("totals account spend from the campaigns", () => {
    const total = campaigns.reduce(
      (sum, campaign) => sum + campaign.metrics.spendEur,
      0,
    );
    expect(account.spendEur).toBeCloseTo(total, 2);
  });

  it("uses object ids that are unique across the tree", () => {
    const ids = campaigns.flatMap((campaign) => [
      campaign.id,
      ...campaign.adSets.flatMap((adSet) => [
        adSet.id,
        ...adSet.ads.map((ad) => ad.id),
      ]),
    ]);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("loadDashboardSnapshot", () => {
  it("resolves the snapshot", async () => {
    await expect(loadDashboardSnapshot()).resolves.toBe(mockDashboardSnapshot);
  });
});
