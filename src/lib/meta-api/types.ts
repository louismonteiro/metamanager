import type { RateLimitSnapshot } from "./rate-limit";

/** Cursor pagination metadata returned under `paging`. */
export interface GraphPaging {
  cursors?: {
    before?: string;
    after?: string;
  };
  next?: string;
  previous?: string;
}

/** Envelope of every Graph API edge (list) response. */
export interface GraphListResponse<T> {
  data: T[];
  paging?: GraphPaging;
}

/** A single page of an edge, normalised for callers. */
export interface Page<T> {
  data: T[];
  nextCursor: string | undefined;
  previousCursor: string | undefined;
  hasNextPage: boolean;
  rateLimit: RateLimitSnapshot;
}

/** Result of a non-paginated request. */
export interface MetaApiResult<T> {
  data: T;
  rateLimit: RateLimitSnapshot;
}

export interface PaginationParams {
  /** Page size. Meta caps this per edge; it is a request, not a guarantee. */
  limit?: number;
  after?: string;
  before?: string;
}

export type QueryValue = string | number | boolean | readonly string[];

export type QueryParams = Record<string, QueryValue | undefined>;
