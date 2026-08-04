import type { RateLimitSnapshot } from "./rate-limit";

/**
 * Graph API error payload, as returned under the `error` key.
 * @see https://developers.facebook.com/docs/marketing-api/error-reference
 */
export interface GraphErrorPayload {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  error_user_title?: string;
  error_user_msg?: string;
  fbtrace_id?: string;
  /** Attributes a failure to specific input fields. */
  blame_field_specs?: string[][];
}

export interface MetaApiErrorDetails {
  status: number;
  code?: number;
  subcode?: number;
  type?: string;
  fbtraceId?: string;
  userTitle?: string;
  userMessage?: string;
  blameFieldSpecs?: string[][];
  rateLimit?: RateLimitSnapshot;
  /** Seconds to wait before retrying, when the API or headers say so. */
  retryAfterSeconds?: number;
}

/** Base class for every failure raised by the Meta API client. */
export class MetaApiError extends Error {
  readonly status: number;
  readonly code: number | undefined;
  readonly subcode: number | undefined;
  readonly type: string | undefined;
  readonly fbtraceId: string | undefined;
  readonly userTitle: string | undefined;
  readonly userMessage: string | undefined;
  readonly blameFieldSpecs: string[][];
  readonly rateLimit: RateLimitSnapshot | undefined;
  readonly retryAfterSeconds: number | undefined;

  constructor(message: string, details: MetaApiErrorDetails) {
    super(message);
    this.name = new.target.name;
    this.status = details.status;
    this.code = details.code;
    this.subcode = details.subcode;
    this.type = details.type;
    this.fbtraceId = details.fbtraceId;
    this.userTitle = details.userTitle;
    this.userMessage = details.userMessage;
    this.blameFieldSpecs = details.blameFieldSpecs ?? [];
    this.rateLimit = details.rateLimit;
    this.retryAfterSeconds = details.retryAfterSeconds;
  }

  /** Whether retrying the exact same request could plausibly succeed. */
  get isRetryable(): boolean {
    return false;
  }
}

/** Token missing, expired, or lacking the required permission. */
export class MetaAuthError extends MetaApiError {}

/** App, user, ad-account or Business Use Case throttling. */
export class MetaRateLimitError extends MetaApiError {
  override get isRetryable(): boolean {
    return true;
  }
}

/** Invalid parameter or missing required parameter. */
export class MetaValidationError extends MetaApiError {}

/** Transport-level failure: network down, DNS, timeout, unparseable body. */
export class MetaTransportError extends MetaApiError {
  override get isRetryable(): boolean {
    return true;
  }
}

/** The client itself is not configured (no token, bad version pin). */
export class MetaConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MetaConfigError";
  }
}

/**
 * Codes are the contract — the human-readable descriptions change without
 * notice, so classification is by numeric code only.
 */
const AUTH_CODES = new Set([10, 102, 104, 190, 200, 294]);
const RATE_LIMIT_CODES = new Set([4, 17, 32, 613, 80004]);
const VALIDATION_CODES = new Set([100, 194, 2635, 3018]);

/** One error code per Business Use Case type. */
function isBusinessUseCaseLimit(code: number): boolean {
  return code >= 80000 && code <= 80014;
}

export function isRateLimitCode(code: number | undefined): boolean {
  if (code === undefined) return false;
  return RATE_LIMIT_CODES.has(code) || isBusinessUseCaseLimit(code);
}

export function isAuthCode(code: number | undefined): boolean {
  return code !== undefined && AUTH_CODES.has(code);
}

export function isValidationCode(code: number | undefined): boolean {
  return code !== undefined && VALIDATION_CODES.has(code);
}

/** Maps a Graph error payload onto the matching {@link MetaApiError} subclass. */
export function createMetaApiError(
  payload: GraphErrorPayload | undefined,
  details: Omit<MetaApiErrorDetails, "code" | "subcode" | "type" | "fbtraceId">,
): MetaApiError {
  const code = payload?.code;
  const message =
    payload?.error_user_msg ??
    payload?.message ??
    `Meta API request failed with status ${details.status}`;

  const full: MetaApiErrorDetails = {
    ...details,
    ...(code !== undefined ? { code } : {}),
    ...(payload?.error_subcode !== undefined
      ? { subcode: payload.error_subcode }
      : {}),
    ...(payload?.type !== undefined ? { type: payload.type } : {}),
    ...(payload?.fbtrace_id !== undefined
      ? { fbtraceId: payload.fbtrace_id }
      : {}),
    ...(payload?.error_user_title !== undefined
      ? { userTitle: payload.error_user_title }
      : {}),
    ...(payload?.error_user_msg !== undefined
      ? { userMessage: payload.error_user_msg }
      : {}),
    ...(payload?.blame_field_specs !== undefined
      ? { blameFieldSpecs: payload.blame_field_specs }
      : {}),
  };

  if (isRateLimitCode(code) || details.status === 429) {
    return new MetaRateLimitError(message, full);
  }
  if (isAuthCode(code) || details.status === 401) {
    return new MetaAuthError(message, full);
  }
  if (isValidationCode(code) || details.status === 400) {
    return new MetaValidationError(message, full);
  }
  return new MetaApiError(message, full);
}
