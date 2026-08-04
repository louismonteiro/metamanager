import {
  buildGraphUrl,
  requireMetaApiConfig,
  type MetaApiConfig,
  type MetaApiEnv,
} from "./config";
import {
  createMetaApiError,
  MetaTransportError,
  type GraphErrorPayload,
} from "./errors";
import { parseRateLimitHeaders, type RateLimitSnapshot } from "./rate-limit";
import type {
  GraphListResponse,
  MetaApiResult,
  Page,
  PaginationParams,
  QueryParams,
} from "./types";

export interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  searchParams?: QueryParams;
  body?: Record<string, unknown>;
  signal?: AbortSignal;
}

/** Injected so tests can drive the client without touching the network. */
export type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

export interface MetaApiClientOptions {
  fetchImpl?: FetchLike;
}

const EMPTY_RATE_LIMIT: RateLimitSnapshot = {
  businessUseCase: [],
  maxUtilisationPct: 0,
};

function appendSearchParams(url: URL, params: QueryParams | undefined): void {
  if (!params) return;
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    url.searchParams.set(
      key,
      Array.isArray(value) ? value.join(",") : String(value),
    );
  }
}

/**
 * Typed client for the Meta Marketing API.
 *
 * Every request is pinned to a Graph API version, carries the token in the
 * `Authorization` header (never the query string, so it stays out of logs and
 * proxy traces), surfaces rate-limit headers, and maps Graph errors onto typed
 * exceptions.
 */
export class MetaApiClient {
  readonly config: MetaApiConfig;
  private readonly fetchImpl: FetchLike;

  constructor(config: MetaApiConfig, options: MetaApiClientOptions = {}) {
    this.config = config;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  /** Builds a client from the environment. Throws `MetaConfigError` if unset. */
  static fromEnv(
    env: MetaApiEnv = process.env,
    options: MetaApiClientOptions = {},
  ): MetaApiClient {
    return new MetaApiClient(requireMetaApiConfig(env), options);
  }

  async request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<MetaApiResult<T>> {
    const url = buildGraphUrl(this.config, path);
    appendSearchParams(url, options.searchParams);

    const timeout = AbortSignal.timeout(this.config.timeoutMs);
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeout])
      : timeout;

    const init: RequestInit = {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      signal,
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    };

    let response: Response;
    try {
      response = await this.fetchImpl(url.toString(), init);
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause);
      throw new MetaTransportError(
        `Meta API request to ${path} failed: ${reason}`,
        { status: 0, rateLimit: EMPTY_RATE_LIMIT },
      );
    }

    const rateLimit = parseRateLimitHeaders(response.headers);

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      if (response.ok) {
        throw new MetaTransportError(
          `Meta API returned a non-JSON body for ${path}`,
          { status: response.status, rateLimit },
        );
      }
      payload = undefined;
    }

    if (!response.ok) {
      const error = (payload as { error?: GraphErrorPayload } | undefined)
        ?.error;
      throw createMetaApiError(error, {
        status: response.status,
        rateLimit,
        ...(rateLimit.retryAfterSeconds !== undefined
          ? { retryAfterSeconds: rateLimit.retryAfterSeconds }
          : {}),
      });
    }

    return { data: payload as T, rateLimit };
  }

  /** Fetches one page of an edge and normalises its cursors. */
  async getPage<T>(
    path: string,
    params: QueryParams & PaginationParams = {},
  ): Promise<Page<T>> {
    const { data, rateLimit } = await this.request<GraphListResponse<T>>(path, {
      searchParams: params,
    });

    const paging = data?.paging;
    // `paging.next` is the authority on whether more data exists: Meta returns
    // an `after` cursor on the last page too.
    const hasNextPage = Boolean(paging?.next);

    return {
      data: Array.isArray(data?.data) ? data.data : [],
      nextCursor: hasNextPage ? paging?.cursors?.after : undefined,
      previousCursor: paging?.cursors?.before,
      hasNextPage,
      rateLimit,
    };
  }

  /**
   * Walks an edge page by page.
   *
   * Cursors are followed explicitly rather than by chasing `paging.next`, whose
   * URL embeds the access token and an unpinned version.
   */
  async *paginate<T>(
    path: string,
    params: QueryParams & PaginationParams = {},
    options: { maxPages?: number } = {},
  ): AsyncGenerator<Page<T>, void, undefined> {
    const maxPages = options.maxPages ?? 25;
    let after = params.after;

    for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
      const page: Page<T> = await this.getPage<T>(path, {
        ...params,
        ...(after ? { after } : {}),
      });
      yield page;

      if (!page.hasNextPage || !page.nextCursor) return;
      after = page.nextCursor;
    }
  }

  /** Collects every item of an edge, up to `maxPages` requests. */
  async collect<T>(
    path: string,
    params: QueryParams & PaginationParams = {},
    options: { maxPages?: number } = {},
  ): Promise<T[]> {
    const items: T[] = [];
    for await (const page of this.paginate<T>(path, params, options)) {
      items.push(...page.data);
    }
    return items;
  }
}
