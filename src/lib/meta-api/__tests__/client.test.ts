import { describe, expect, it, vi } from "vitest";

import { MetaApiClient, type FetchLike } from "../client";
import type { MetaApiConfig } from "../config";
import {
  MetaAuthError,
  MetaRateLimitError,
  MetaTransportError,
  MetaValidationError,
} from "../errors";

const config: MetaApiConfig = {
  accessToken: "test-token",
  version: "v26.0",
  host: "https://graph.facebook.com",
  timeoutMs: 5_000,
};

function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", ...init.headers },
  });
}

function clientWith(fetchImpl: FetchLike): MetaApiClient {
  return new MetaApiClient(config, { fetchImpl });
}

describe("MetaApiClient.request", () => {
  it("pins the version and sends the token as a bearer header", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockResolvedValue(jsonResponse({ id: "act_1" }));

    await clientWith(fetchImpl).request("me/adaccounts");

    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe("https://graph.facebook.com/v26.0/me/adaccounts");
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      "Bearer test-token",
    );
  });

  it("keeps the token out of the query string", async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(jsonResponse({}));

    await clientWith(fetchImpl).request("me/adaccounts");

    expect(fetchImpl.mock.calls[0]?.[0]).not.toContain("access_token");
  });

  it("serialises array search params as comma-separated values", async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(jsonResponse({}));

    await clientWith(fetchImpl).request("me/adaccounts", {
      searchParams: { fields: ["id", "name"], limit: 25, skip: undefined },
    });

    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.searchParams.get("fields")).toBe("id,name");
    expect(url.searchParams.get("limit")).toBe("25");
    expect(url.searchParams.has("skip")).toBe(false);
  });

  it("surfaces rate-limit headers alongside the payload", async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(
      jsonResponse(
        { data: [] },
        {
          headers: {
            "x-app-usage": JSON.stringify({
              call_count: 42,
              total_cputime: 8,
              total_time: 11,
            }),
          },
        },
      ),
    );

    const result = await clientWith(fetchImpl).request("me/adaccounts");

    expect(result.rateLimit.appUsage?.callCount).toBe(42);
    expect(result.rateLimit.maxUtilisationPct).toBe(42);
  });

  it("maps an OAuth error code to MetaAuthError", async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(
      jsonResponse(
        {
          error: {
            message: "Invalid OAuth access token",
            code: 190,
            type: "OAuthException",
            fbtrace_id: "trace-1",
          },
        },
        { status: 400 },
      ),
    );

    await expect(
      clientWith(fetchImpl).request("me/adaccounts"),
    ).rejects.toBeInstanceOf(MetaAuthError);
  });

  it("maps a Business Use Case limit code to MetaRateLimitError", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockResolvedValue(
        jsonResponse(
          { error: { message: "Too many calls", code: 80004 } },
          { status: 400, headers: { "retry-after": "300" } },
        ),
      );

    const error = await clientWith(fetchImpl)
      .request("me/adaccounts")
      .catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(MetaRateLimitError);
    expect((error as MetaRateLimitError).retryAfterSeconds).toBe(300);
    expect((error as MetaRateLimitError).isRetryable).toBe(true);
  });

  it("keeps blame_field_specs so failures can be attributed to inputs", async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(
      jsonResponse(
        {
          error: {
            message: "Invalid parameter",
            code: 100,
            error_subcode: 1487534,
            blame_field_specs: [["targeting", "geo_locations"]],
          },
        },
        { status: 400 },
      ),
    );

    const error = await clientWith(fetchImpl)
      .request("act_1/adsets")
      .catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(MetaValidationError);
    expect((error as MetaValidationError).subcode).toBe(1487534);
    expect((error as MetaValidationError).blameFieldSpecs).toEqual([
      ["targeting", "geo_locations"],
    ]);
  });

  it("wraps a network failure in MetaTransportError", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockRejectedValue(new Error("ECONNREFUSED"));

    const error = await clientWith(fetchImpl)
      .request("me/adaccounts")
      .catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(MetaTransportError);
    expect((error as MetaTransportError).isRetryable).toBe(true);
  });

  it("wraps a non-JSON success body in MetaTransportError", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockResolvedValue(new Response("<html>oops</html>", { status: 200 }));

    await expect(
      clientWith(fetchImpl).request("me/adaccounts"),
    ).rejects.toBeInstanceOf(MetaTransportError);
  });
});

describe("MetaApiClient pagination", () => {
  it("reports no next page when paging.next is absent", async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(
      jsonResponse({
        data: [{ id: "act_1" }],
        paging: { cursors: { before: "B", after: "A" } },
      }),
    );

    const page = await clientWith(fetchImpl).getPage<{ id: string }>(
      "me/adaccounts",
    );

    expect(page.data).toHaveLength(1);
    expect(page.hasNextPage).toBe(false);
    expect(page.nextCursor).toBeUndefined();
    expect(page.previousCursor).toBe("B");
  });

  it("walks pages by cursor and stops on the last one", async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: "act_1" }],
          paging: {
            cursors: { after: "cursor-1" },
            next: "https://graph.facebook.com/next",
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: "act_2" }],
          paging: { cursors: { after: "cursor-2" } },
        }),
      );

    const items = await clientWith(fetchImpl).collect<{ id: string }>(
      "me/adaccounts",
    );

    expect(items.map((item) => item.id)).toEqual(["act_1", "act_2"]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    const secondUrl = new URL(String(fetchImpl.mock.calls[1]?.[0]));
    expect(secondUrl.searchParams.get("after")).toBe("cursor-1");
    // The version stays pinned instead of chasing paging.next.
    expect(secondUrl.pathname.startsWith("/v26.0/")).toBe(true);
  });

  it("stops at maxPages even when more pages exist", async () => {
    // A fresh Response per call: a body can only be consumed once.
    const fetchImpl = vi.fn<FetchLike>().mockImplementation(async () =>
      jsonResponse({
        data: [{ id: "act_x" }],
        paging: {
          cursors: { after: "always-more" },
          next: "https://graph.facebook.com/next",
        },
      }),
    );

    const items = await clientWith(fetchImpl).collect<{ id: string }>(
      "me/adaccounts",
      {},
      { maxPages: 3 },
    );

    expect(items).toHaveLength(3);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("tolerates a response without a data array", async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(jsonResponse({}));

    const page = await clientWith(fetchImpl).getPage("me/adaccounts");

    expect(page.data).toEqual([]);
    expect(page.hasNextPage).toBe(false);
  });
});
