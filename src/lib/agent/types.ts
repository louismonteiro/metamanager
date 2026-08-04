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

export interface AgentReply {
  message: ChatMessage;
  intent: ParsedIntent;
  plan: AgentPlan;
  /**
   * `placeholder` while the LLM brain is not wired in: the plan is derived from
   * deterministic parsing, not from a model, and nothing is executed.
   */
  engine: "placeholder";
}
