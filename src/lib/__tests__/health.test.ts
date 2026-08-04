import { describe, expect, it, vi } from "vitest";

import { buildHealthReport, checkMetaConnection } from "../health";
import type { FetchLike } from "../meta-api";

function jsonFetch(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): FetchLike {
  return vi.fn<FetchLike>().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: init.status ?? 200,
      headers: { "content-type": "application/json", ...init.headers },
    }),
  );
}

describe("checkMetaConnection", () => {
  it("reports unconfigured when the token is missing, without calling out", async () => {
    const fetchImpl = jsonFetch({});
    const check = await checkMetaConnection({}, { fetchImpl });

    expect(check.status).toBe("unconfigured");
    expect(check.tokenPresent).toBe(false);
    expect(check.message).toContain("META_ACCESS_TOKEN");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reports ok and names the reachable accounts", async () => {
    const check = await checkMetaConnection(
      { META_ACCESS_TOKEN: "tok" },
      {
        fetchImpl: jsonFetch({
          data: [
            { id: "act_1", name: "Conta principal" },
            { id: "act_2", name: "Conta cliente" },
          ],
        }),
      },
    );

    expect(check.status).toBe("ok");
    expect(check.accountCount).toBe(2);
    expect(check.accountNames).toEqual(["Conta principal", "Conta cliente"]);
    expect(check.apiVersion).toBe("v26.0");
    expect(check.edge).toBe("me/adaccounts");
  });

  it("names the business edge when a business id is configured", async () => {
    const check = await checkMetaConnection(
      { META_ACCESS_TOKEN: "tok", META_BUSINESS_ID: "987" },
      { fetchImpl: jsonFetch({ data: [] }) },
    );

    expect(check.edge).toBe("987/owned_ad_accounts");
  });

  it("degrades when rate-limit utilisation is near the ceiling", async () => {
    const check = await checkMetaConnection(
      { META_ACCESS_TOKEN: "tok" },
      {
        fetchImpl: jsonFetch(
          { data: [{ id: "act_1", name: "Conta" }] },
          {
            headers: {
              "x-app-usage": JSON.stringify({
                call_count: 96,
                total_cputime: 10,
                total_time: 12,
              }),
            },
          },
        ),
      },
    );

    expect(check.status).toBe("degraded");
    expect(check.rateLimitUtilisationPct).toBe(96);
  });

  it("reports the Graph error code on a rejected token", async () => {
    const check = await checkMetaConnection(
      { META_ACCESS_TOKEN: "bad" },
      {
        fetchImpl: jsonFetch(
          { error: { message: "Invalid OAuth access token", code: 190 } },
          { status: 400 },
        ),
      },
    );

    expect(check.status).toBe("error");
    expect(check.errorCode).toBe(190);
    expect(check.tokenPresent).toBe(true);
  });
});

describe("buildHealthReport", () => {
  it("stays degraded rather than failing when Meta is unconfigured", async () => {
    const report = await buildHealthReport({}, { fetchImpl: jsonFetch({}) });

    expect(report.status).toBe("degraded");
    expect(report.service).toBe("metamanager");
    expect(report.meta.status).toBe("unconfigured");
  });

  it("is ok when the Meta probe succeeds", async () => {
    const report = await buildHealthReport(
      { META_ACCESS_TOKEN: "tok" },
      { fetchImpl: jsonFetch({ data: [{ id: "act_1", name: "Conta" }] }) },
    );

    expect(report.status).toBe("ok");
    expect(Number.isNaN(Date.parse(report.checkedAt))).toBe(false);
  });

  it("is an error when the Meta probe fails", async () => {
    const report = await buildHealthReport(
      { META_ACCESS_TOKEN: "tok" },
      {
        fetchImpl: jsonFetch(
          { error: { message: "nope", code: 190 } },
          { status: 400 },
        ),
      },
    );

    expect(report.status).toBe("error");
  });
});
