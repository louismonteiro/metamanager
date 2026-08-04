import { MetaConfigError } from "./errors";

/**
 * Graph API host. Paths are version-agnostic; the version segment is always
 * injected by {@link buildGraphUrl} so no request can go out unversioned.
 */
export const META_GRAPH_HOST = "https://graph.facebook.com";

/**
 * Pinned Graph API version.
 *
 * Unversioned calls fall back to the App Dashboard default, and expired
 * versions silently downgrade to the next oldest instead of erroring — so the
 * version is pinned explicitly on every request. See `docs/meta-ads-endpoints.md`.
 */
export const META_API_VERSION = "v26.0";

export const META_API_DEFAULT_TIMEOUT_MS = 15_000;

export interface MetaApiConfig {
  accessToken: string;
  /** Business Manager id. When set, ad accounts are read from the business. */
  businessId?: string;
  version: string;
  host: string;
  timeoutMs: number;
}

/**
 * Environment shape the config is read from.
 *
 * The index signature is what makes `process.env` assignable while the named
 * keys stay documented and checked.
 */
export interface MetaApiEnv {
  META_ACCESS_TOKEN?: string | undefined;
  META_BUSINESS_ID?: string | undefined;
  META_API_VERSION?: string | undefined;
  META_API_TIMEOUT_MS?: string | undefined;
  META_GRAPH_HOST?: string | undefined;
  [key: string]: string | undefined;
}

export type MetaApiConfigResult =
  { ok: true; config: MetaApiConfig } | { ok: false; reason: string };

const VERSION_PATTERN = /^v\d+\.\d+$/;

function parseTimeout(raw: string | undefined): number {
  if (!raw) return META_API_DEFAULT_TIMEOUT_MS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : META_API_DEFAULT_TIMEOUT_MS;
}

/**
 * Reads the Meta API config without throwing. Used by surfaces that must render
 * even when the integration is not configured yet (the health page).
 */
export function readMetaApiConfig(
  env: MetaApiEnv = process.env,
): MetaApiConfigResult {
  const accessToken = env.META_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    return { ok: false, reason: "META_ACCESS_TOKEN is not set" };
  }

  const version = env.META_API_VERSION?.trim() || META_API_VERSION;
  if (!VERSION_PATTERN.test(version)) {
    return {
      ok: false,
      reason: `META_API_VERSION must look like "v26.0", got "${version}"`,
    };
  }

  const businessId = env.META_BUSINESS_ID?.trim();

  return {
    ok: true,
    config: {
      accessToken,
      ...(businessId ? { businessId } : {}),
      version,
      host: env.META_GRAPH_HOST?.trim() || META_GRAPH_HOST,
      timeoutMs: parseTimeout(env.META_API_TIMEOUT_MS),
    },
  };
}

/** Reads the Meta API config, throwing {@link MetaConfigError} when unusable. */
export function requireMetaApiConfig(
  env: MetaApiEnv = process.env,
): MetaApiConfig {
  const result = readMetaApiConfig(env);
  if (!result.ok) throw new MetaConfigError(result.reason);
  return result.config;
}

/** Builds a fully versioned Graph API URL for `path`. */
export function buildGraphUrl(
  config: Pick<MetaApiConfig, "host" | "version">,
  path: string,
): URL {
  const normalized = path.replace(/^\/+/, "");
  return new URL(`${config.host}/${config.version}/${normalized}`);
}
