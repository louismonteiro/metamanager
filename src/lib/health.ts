import {
  listAdAccounts,
  MetaApiClient,
  MetaApiError,
  readMetaApiConfig,
  type MetaApiClientOptions,
  type MetaApiEnv,
} from "@/lib/meta-api";

export type MetaConnectionStatus = "ok" | "degraded" | "unconfigured" | "error";

export interface MetaConnectionCheck {
  status: MetaConnectionStatus;
  /** Whether `META_ACCESS_TOKEN` is present in the environment. */
  tokenPresent: boolean;
  /** Graph API version every request is pinned to. */
  apiVersion: string;
  /** Which edge the account listing used. */
  edge: string | null;
  accountCount: number | null;
  accountNames: string[];
  /** Highest rate-limit utilisation seen on the probe response, 0-100. */
  rateLimitUtilisationPct: number | null;
  latencyMs: number | null;
  message: string;
  errorCode: number | null;
}

export interface HealthReport {
  status: "ok" | "degraded" | "error";
  service: "metamanager";
  version: string;
  checkedAt: string;
  uptimeSeconds: number;
  meta: MetaConnectionCheck;
}

const APP_VERSION = process.env.npm_package_version ?? "1.0.0";

/**
 * Probes the Meta connection with the cheapest real call available: listing the
 * accessible ad accounts. A missing token is reported, not thrown — the health
 * surface has to render on an unconfigured environment.
 */
export async function checkMetaConnection(
  env: MetaApiEnv = process.env,
  clientOptions: MetaApiClientOptions = {},
): Promise<MetaConnectionCheck> {
  const configResult = readMetaApiConfig(env);

  if (!configResult.ok) {
    return {
      status: "unconfigured",
      tokenPresent: Boolean(env.META_ACCESS_TOKEN?.trim()),
      apiVersion: env.META_API_VERSION?.trim() ?? "v26.0",
      edge: null,
      accountCount: null,
      accountNames: [],
      rateLimitUtilisationPct: null,
      latencyMs: null,
      message: configResult.reason,
      errorCode: null,
    };
  }

  const config = configResult.config;
  const client = new MetaApiClient(config, clientOptions);
  const edge = config.businessId
    ? `${config.businessId}/owned_ad_accounts`
    : "me/adaccounts";
  const startedAt = Date.now();

  try {
    const page = await listAdAccounts(client, { limit: 10 });
    const utilisation = page.rateLimit.maxUtilisationPct;

    return {
      status: utilisation >= 90 ? "degraded" : "ok",
      tokenPresent: true,
      apiVersion: config.version,
      edge,
      accountCount: page.data.length,
      accountNames: page.data.map(
        (account) => account.name ?? account.id ?? "unnamed account",
      ),
      rateLimitUtilisationPct: utilisation,
      latencyMs: Date.now() - startedAt,
      message:
        utilisation >= 90
          ? `Connected, but rate-limit utilisation is at ${utilisation}%`
          : `Connected. ${page.data.length} ad account(s) reachable${
              page.hasNextPage ? " (more pages available)" : ""
            }`,
      errorCode: null,
    };
  } catch (cause) {
    const isApiError = cause instanceof MetaApiError;
    return {
      status: "error",
      tokenPresent: true,
      apiVersion: config.version,
      edge,
      accountCount: null,
      accountNames: [],
      rateLimitUtilisationPct: isApiError
        ? (cause.rateLimit?.maxUtilisationPct ?? null)
        : null,
      latencyMs: Date.now() - startedAt,
      message: cause instanceof Error ? cause.message : String(cause),
      errorCode: isApiError ? (cause.code ?? null) : null,
    };
  }
}

function rollUpStatus(meta: MetaConnectionStatus): HealthReport["status"] {
  if (meta === "ok") return "ok";
  if (meta === "error") return "error";
  // `unconfigured` and `degraded` both mean: the app runs, Meta calls will not.
  return "degraded";
}

/** Full health report: the app is up, and this is the state of its Meta link. */
export async function buildHealthReport(
  env: MetaApiEnv = process.env,
  clientOptions: MetaApiClientOptions = {},
): Promise<HealthReport> {
  const meta = await checkMetaConnection(env, clientOptions);

  return {
    status: rollUpStatus(meta.status),
    service: "metamanager",
    version: APP_VERSION,
    checkedAt: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    meta,
  };
}
