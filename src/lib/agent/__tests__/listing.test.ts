import { describe, expect, it, vi } from "vitest";

import type { FetchLike, MetaApiEnv } from "@/lib/meta-api";
import { fetchCampaignListing, toCampaignSummary } from "../listing";
import { respondToMessage } from "../respond";

const ENV: MetaApiEnv = { META_ACCESS_TOKEN: "test-token" };

interface Route {
  /** Substring of the request URL this route answers. */
  match: string;
  status?: number;
  body: unknown;
}

/** A Graph API stand-in that answers by edge, so no test touches the network. */
function graphFetch(routes: Route[]): ReturnType<typeof vi.fn<FetchLike>> {
  return vi.fn<FetchLike>(async (input: string) => {
    const route = routes.find((candidate) => input.includes(candidate.match));
    if (!route) throw new Error(`Unexpected request: ${input}`);

    return new Response(JSON.stringify(route.body), {
      status: route.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  });
}

const ACCOUNTS_OK: Route = {
  match: "/me/adaccounts",
  body: { data: [{ id: "act_123", name: "Conta principal", currency: "EUR" }] },
};

const CAMPAIGNS_OK: Route = {
  match: "/campaigns",
  body: {
    data: [
      {
        id: "23851",
        name: "Leads Janeiro",
        status: "ACTIVE",
        effective_status: "ACTIVE",
        objective: "OUTCOME_LEADS",
        daily_budget: "5000",
      },
      {
        id: "23852",
        name: "Black Friday",
        status: "PAUSED",
        effective_status: "PAUSED",
        lifetime_budget: "80000",
      },
    ],
  },
};

const SPEND_OK: Route = {
  match: "/insights",
  body: {
    data: [
      { campaign_id: "23851", spend: "1250.50" },
      { campaign_id: "23852", spend: "320" },
    ],
  },
};

describe("toCampaignSummary", () => {
  it("converts budgets from minor units to euros", () => {
    const summary = toCampaignSummary({
      id: "1",
      name: "Leads",
      status: "ACTIVE",
      daily_budget: "5000",
    });

    expect(summary.dailyBudgetEur).toBe(50);
    expect(summary.statusLabel).toBe("ativa");
    expect(summary.spendEur).toBeUndefined();
  });

  it("attaches spend when the insights row exists", () => {
    const summary = toCampaignSummary(
      { id: "1", name: "Leads", status: "ACTIVE" },
      new Map([["1", 120.55]]),
    );

    expect(summary.spendEur).toBe(120.55);
  });

  it("surfaces the delivery state only when it differs from the configured one", () => {
    const same = toCampaignSummary({
      id: "1",
      status: "ACTIVE",
      effective_status: "ACTIVE",
    });
    const differs = toCampaignSummary({
      id: "2",
      status: "ACTIVE",
      effective_status: "CAMPAIGN_PAUSED",
    });

    expect(same.effectiveStatus).toBeUndefined();
    expect(differs.effectiveStatus).toBe("CAMPAIGN_PAUSED");
  });

  it("falls back to the id when the campaign has no name", () => {
    expect(toCampaignSummary({ id: "23851" }).name).toBe("23851");
  });
});

describe("fetchCampaignListing", () => {
  it("reads the account, its campaigns and their spend", async () => {
    const fetchImpl = graphFetch([ACCOUNTS_OK, CAMPAIGNS_OK, SPEND_OK]);

    const listing = await fetchCampaignListing(ENV, { fetchImpl });

    expect(listing.status).toBe("ok");
    if (listing.status !== "ok") return;

    expect(listing.accountId).toBe("act_123");
    expect(listing.accountName).toBe("Conta principal");
    expect(listing.totalCount).toBe(2);
    expect(listing.spendUnavailable).toBe(false);
    expect(listing.campaigns[0]).toMatchObject({
      name: "Leads Janeiro",
      statusLabel: "ativa",
      dailyBudgetEur: 50,
      spendEur: 1250.5,
    });
    expect(listing.campaigns[1]).toMatchObject({
      name: "Black Friday",
      statusLabel: "em pausa",
      lifetimeBudgetEur: 800,
      spendEur: 320,
    });
  });

  it("reports the missing token instead of throwing", async () => {
    const listing = await fetchCampaignListing({}, {});

    expect(listing.status).toBe("unconfigured");
    if (listing.status !== "unconfigured") return;
    expect(listing.reason).toContain("META_ACCESS_TOKEN");
  });

  it("says so when the token reaches no ad account", async () => {
    const fetchImpl = graphFetch([
      { match: "/me/adaccounts", body: { data: [] } },
    ]);

    const listing = await fetchCampaignListing(ENV, { fetchImpl });

    expect(listing.status).toBe("no_account");
  });

  it("keeps the listing when the spend call fails", async () => {
    const fetchImpl = graphFetch([
      ACCOUNTS_OK,
      CAMPAIGNS_OK,
      {
        match: "/insights",
        status: 400,
        body: { error: { message: "Insights unavailable", code: 100 } },
      },
    ]);

    const listing = await fetchCampaignListing(ENV, { fetchImpl });

    expect(listing.status).toBe("ok");
    if (listing.status !== "ok") return;
    expect(listing.spendUnavailable).toBe(true);
    expect(listing.totalCount).toBe(2);
    expect(listing.campaigns[0]?.spendEur).toBeUndefined();
    expect(listing.campaigns[0]?.dailyBudgetEur).toBe(50);
  });

  it("surfaces a Graph failure with its code", async () => {
    const fetchImpl = graphFetch([
      ACCOUNTS_OK,
      {
        match: "/campaigns",
        status: 401,
        body: {
          error: {
            message: "Invalid OAuth access token",
            code: 190,
            type: "OAuthException",
          },
        },
      },
    ]);

    const listing = await fetchCampaignListing(ENV, { fetchImpl });

    expect(listing.status).toBe("error");
    if (listing.status !== "error") return;
    expect(listing.code).toBe(190);
    expect(listing.message).toContain("Invalid OAuth access token");
  });

  it("skips the account lookup when the account is given", async () => {
    const fetchImpl = graphFetch([CAMPAIGNS_OK, SPEND_OK]);

    const listing = await fetchCampaignListing(
      ENV,
      { fetchImpl },
      { accountId: "act_999", limit: 5 },
    );

    expect(listing.status).toBe("ok");
    const campaignsCall = fetchImpl.mock.calls.find((call) =>
      String(call[0]).includes("/campaigns"),
    );
    const url = new URL(String(campaignsCall?.[0]));
    expect(url.pathname).toBe("/v26.0/act_999/campaigns");
    expect(url.searchParams.get("limit")).toBe("5");
  });

  it("never puts the access token in the request URL", async () => {
    const fetchImpl = graphFetch([ACCOUNTS_OK, CAMPAIGNS_OK, SPEND_OK]);

    await fetchCampaignListing(ENV, { fetchImpl });

    for (const call of fetchImpl.mock.calls) {
      expect(String(call[0])).not.toContain("test-token");
    }
  });

  it("rejects an invalid account id with a Portuguese error message", async () => {
    const fetchImpl = graphFetch([]);

    const listing = await fetchCampaignListing(
      ENV,
      { fetchImpl },
      { accountId: "invalid-account" },
    );

    expect(listing.status).toBe("error");
    if (listing.status !== "error") return;
    expect(listing.message).toContain("Formato de conta inválido");
    expect(listing.message).toContain("act_");
  });

  it("accepts a valid account id with the act_ prefix", async () => {
    const fetchImpl = graphFetch([CAMPAIGNS_OK, SPEND_OK]);

    const listing = await fetchCampaignListing(
      ENV,
      { fetchImpl },
      { accountId: "act_123456789" },
    );

    expect(listing.status).toBe("ok");
  });

  it("accepts a valid account id without the act_ prefix", async () => {
    const fetchImpl = graphFetch([CAMPAIGNS_OK, SPEND_OK]);

    const listing = await fetchCampaignListing(
      ENV,
      { fetchImpl },
      { accountId: "987654321" },
    );

    expect(listing.status).toBe("ok");
  });
});

describe("respondToMessage — campaign listing", () => {
  it("answers 'Que campanhas tenho criadas?' with the real campaigns", async () => {
    const fetchImpl = graphFetch([ACCOUNTS_OK, CAMPAIGNS_OK, SPEND_OK]);

    const reply = await respondToMessage("Que campanhas tenho criadas?", {
      env: ENV,
      clientOptions: { fetchImpl },
    });

    expect(reply.intent.action).toBe("list");
    expect(reply.intent.level).toBe("campaign");
    expect(reply.engine).toBe("meta-api");
    expect(reply.listing?.status).toBe("ok");

    const content = reply.message.content;
    expect(content).toContain("2 campanhas");
    expect(content).toContain("Conta principal");
    expect(content).toContain("Leads Janeiro");
    expect(content).toContain("ativa");
    expect(content).toContain("Black Friday");
    expect(content).toContain("em pausa");
    // Amounts in euros with Portuguese formatting: €50,00/dia of budget, and
    // €800,00 of lifetime budget against €320,00 spent.
    expect(content).toContain("50,00");
    expect(content).toContain("800,00");
    expect(content).toContain("320,00");
    expect(content).not.toContain("nenhuma chamada foi executada");
  });

  it("reports an empty account plainly", async () => {
    const fetchImpl = graphFetch([
      ACCOUNTS_OK,
      { match: "/campaigns", body: { data: [] } },
      { match: "/insights", body: { data: [] } },
    ]);

    const reply = await respondToMessage("Lista as minhas campanhas", {
      env: ENV,
      clientOptions: { fetchImpl },
    });

    expect(reply.message.content).toContain("Não existe nenhuma campanha");
  });

  it("explains a missing token without leaking anything", async () => {
    const reply = await respondToMessage("Que campanhas tenho?", { env: {} });

    expect(reply.engine).toBe("placeholder");
    expect(reply.listing?.status).toBe("unconfigured");
    expect(reply.message.content).toContain("META_ACCESS_TOKEN");
  });

  const ADS_OK: Route = {
    match: "/ads",
    body: {
      data: [
        {
          id: "23851001",
          name: "Anúncio Janeiro",
          status: "ACTIVE",
          effective_status: "ACTIVE",
          adset_id: "238510",
          campaign_id: "23851",
        },
      ],
    },
  };

  it("executes the listing for ads", async () => {
    const reply = await respondToMessage("Lista os meus anúncios", {
      env: ENV,
      clientOptions: {
        fetchImpl: graphFetch([ACCOUNTS_OK, ADS_OK]),
      },
    });

    expect(reply.intent.action).toBe("list");
    expect(reply.intent.level).toBe("ad");
    expect(reply.listing).toBeDefined();
    expect(reply.listing?.status).toBe("ok");
    expect(
      reply.plan.steps.some((step) => step.endpoint.includes("/ads")),
    ).toBe(true);
  });
});
