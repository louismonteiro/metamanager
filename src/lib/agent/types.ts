export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

/** What the user is asking the agent to do. */
export type AgentAction =
  | "create"
  | "duplicate"
  | "pause"
  | "resume"
  | "update_budget"
  | "export"
  | "preview"
  /** Inventory: which objects exist, and in what state. */
  | "list"
  /** Performance: what the objects did. */
  | "report"
  | "unknown";

/** Which level of the ads hierarchy the request is about. */
export type AdObjectLevel =
  "campaign" | "adset" | "ad" | "account" | "lead" | "unknown";

export type BudgetCadence = "daily" | "lifetime" | "unspecified";

export interface BudgetHint {
  /** Always EUR — the product presents and accepts euros only. */
  amountEur: number;
  cadence: BudgetCadence;
}

export interface AudienceHint {
  ageMin?: number;
  ageMax?: number;
  genders?: Array<"female" | "male">;
}

export interface ParsedIntent {
  action: AgentAction;
  level: AdObjectLevel;
  /** True when carrying out the request would write to the Meta API. */
  isWrite: boolean;
  budget?: BudgetHint;
  audience?: AudienceHint;
  /**
   * Candidate location names lifted from the text. Never used as targeting ids:
   * they must be resolved through `GET /{version}/search` before any write.
   */
  targetingHints: string[];
  /** The request refers to a 🏆 winning ad. */
  referencesWinner: boolean;
  /** Reporting window in days, when the user named one. */
  windowDays?: number;
  /** 0-1. Low confidence means the agent should ask before planning. */
  confidence: number;
  rawText: string;
}

export interface PlanStep {
  order: number;
  summary: string;
  method: "GET" | "POST" | "DELETE";
  /** Graph API path, relative to the pinned version. */
  endpoint: string;
  /** Runs with `execution_options=['validate_only']` first. */
  dryRun: boolean;
  note?: string;
}

export interface AgentPlan {
  steps: PlanStep[];
  /** No write executes without an explicit confirmation from the user. */
  requiresConfirmation: boolean;
  warnings: string[];
}

/** One campaign as the chat presents it. Every amount is already in EUR. */
export interface CampaignSummary {
  id: string;
  name: string;
  /** Raw Graph state, e.g. `ACTIVE`. */
  status: string;
  /** Portuguese label for {@link status}. */
  statusLabel: string;
  /** Delivery state, when it differs from the configured one. */
  effectiveStatus?: string;
  objective?: string;
  dailyBudgetEur?: number;
  lifetimeBudgetEur?: number;
  /** Lifetime spend, when the insights call succeeded. */
  spendEur?: number;
}

/**
 * Outcome of answering a listing request against the Meta API.
 *
 * A discriminated union rather than a throw: the chat has to answer even when
 * the integration is unconfigured or the Graph call fails, and the reason is
 * part of the answer.
 */
export type CampaignListing =
  | {
      status: "ok";
      accountId: string;
      accountName: string;
      campaigns: CampaignSummary[];
      /** Campaigns returned. More may exist — see {@link hasMore}. */
      totalCount: number;
      hasMore: boolean;
      /** True when the spend column could not be read; budgets still apply. */
      spendUnavailable: boolean;
    }
  | { status: "unconfigured"; reason: string }
  | { status: "no_account"; reason: string }
  | { status: "error"; message: string; code?: number };

export interface AgentReply {
  message: ChatMessage;
  intent: ParsedIntent;
  plan: AgentPlan;
  /** Present when the request was a listing the agent could execute. */
  listing?: CampaignListing;
  /**
   * `placeholder` when the plan is derived from deterministic parsing and
   * nothing ran; `meta-api` when the answer carries data actually read from the
   * Graph API.
   */
  engine: "placeholder" | "meta-api";
}
