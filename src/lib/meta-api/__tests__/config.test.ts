import { describe, expect, it } from "vitest";

import {
  buildGraphUrl,
  META_API_DEFAULT_TIMEOUT_MS,
  META_API_VERSION,
  readMetaApiConfig,
  requireMetaApiConfig,
} from "../config";
import { MetaConfigError } from "../errors";

describe("readMetaApiConfig", () => {
  it("rejects an environment without a token", () => {
    const result = readMetaApiConfig({});
    expect(result).toEqual({
      ok: false,
      reason: "META_ACCESS_TOKEN is not set",
    });
  });

  it("treats a whitespace-only token as missing", () => {
    const result = readMetaApiConfig({ META_ACCESS_TOKEN: "   " });
    expect(result.ok).toBe(false);
  });

  it("defaults to the pinned version and timeout", () => {
    const result = readMetaApiConfig({ META_ACCESS_TOKEN: "tok" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.version).toBe(META_API_VERSION);
    expect(result.config.timeoutMs).toBe(META_API_DEFAULT_TIMEOUT_MS);
    expect(result.config.businessId).toBeUndefined();
  });

  it("rejects a malformed version pin instead of silently falling back", () => {
    const result = readMetaApiConfig({
      META_ACCESS_TOKEN: "tok",
      META_API_VERSION: "26",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain("META_API_VERSION");
  });

  it("falls back to the default timeout when the value is not usable", () => {
    const result = readMetaApiConfig({
      META_ACCESS_TOKEN: "tok",
      META_API_TIMEOUT_MS: "not-a-number",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.timeoutMs).toBe(META_API_DEFAULT_TIMEOUT_MS);
  });

  it("carries the business id through", () => {
    const result = readMetaApiConfig({
      META_ACCESS_TOKEN: "tok",
      META_BUSINESS_ID: "987654321",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.businessId).toBe("987654321");
  });
});

describe("requireMetaApiConfig", () => {
  it("throws MetaConfigError when the token is absent", () => {
    expect(() => requireMetaApiConfig({})).toThrow(MetaConfigError);
  });
});

describe("buildGraphUrl", () => {
  const config = { host: "https://graph.facebook.com", version: "v26.0" };

  it("pins the version into the path", () => {
    expect(buildGraphUrl(config, "me/adaccounts").toString()).toBe(
      "https://graph.facebook.com/v26.0/me/adaccounts",
    );
  });

  it("normalises a leading slash so the version is never dropped", () => {
    expect(buildGraphUrl(config, "/me/adaccounts").toString()).toBe(
      "https://graph.facebook.com/v26.0/me/adaccounts",
    );
  });
});
