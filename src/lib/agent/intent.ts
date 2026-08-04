import type {
  AdObjectLevel,
  AgentAction,
  AudienceHint,
  BudgetCadence,
  BudgetHint,
  ParsedIntent,
} from "./types";

/**
 * Deterministic intent parsing — the placeholder standing in for the LLM brain.
 *
 * It exists so the chat surface has a real contract to render against: the
 * shapes produced here are the shapes the model will produce later. Both
 * Portuguese and English phrasings are recognised, since the product's users
 * write in Portuguese.
 */

/** Ordered by precedence: a write always outranks the reporting it implies. */
const ACTION_PATTERNS: ReadonlyArray<readonly [AgentAction, RegExp]> = [
  ["pause", /\b(?:pausa|pausar|pause|desativa|desativar|desliga|disable)\b/iu],
  ["resume", /\b(?:retoma|retomar|reativa|reativar|resume|reactivate)\b/iu],
  [
    "duplicate",
    /\b(?:duplica|duplicar|clona|clonar|copia|copiar|duplicate|clone)\b/iu,
  ],
  [
    "create",
    /\b(?:cria|criar|crie|monta|montar|lança|lançar|create|launch|build)\b/iu,
  ],
  [
    "update_budget",
    /\b(?:orçamento|orcamento|budget)\b.*\b(?:sobe|subir|baixa|baixar|aumenta|aumentar|diminui|reduz|raise|lower|increase|decrease)\b|\b(?:sobe|baixa|aumenta|diminui|raise|lower)\b.*\b(?:orçamento|orcamento|budget)\b/iu,
  ],
  ["export", /\b(?:exporta|exportar|export|csv|download)\b/iu],
  ["preview", /\b(?:preview|prévia|previa|pré-visualiza|pre-visualiza)\b/iu],
  [
    "report",
    /\b(?:qual|quais|quanto|quantos|mostra|mostrar|relatório|relatorio|analisa|analisar|compara|report|show|which|what|how much)\b|\b(?:cpa|cpc|ctr|cpm|roas)\b/iu,
  ],
];

/** Writes need confirmation and a dry-run before they touch the account. */
const WRITE_ACTIONS = new Set<AgentAction>([
  "create",
  "duplicate",
  "pause",
  "resume",
  "update_budget",
]);

/** Ad set is matched first: "conjunto de anúncios" also contains "anúncios". */
const LEVEL_PATTERNS: ReadonlyArray<readonly [AdObjectLevel, RegExp]> = [
  ["adset", /\b(?:ad\s?sets?|adsets?|conjuntos?\s+de\s+an[úu]ncios?)\b/iu],
  ["campaign", /\b(?:campanhas?|campaigns?)\b/iu],
  ["lead", /\b(?:leads?|formul[áa]rios?|forms?)\b/iu],
  ["ad", /\b(?:an[úu]ncios?|ads?|criativos?|creatives?)\b/iu],
  ["account", /\b(?:contas?|accounts?)\b/iu],
];

const WINNER_PATTERN = /🏆|\bvencedor(?:a|es|as)?\b|\bwinner(?:s)?\b/iu;

const LIFETIME_PATTERN = /\b(?:total|lifetime|vital[íi]cio|vida)\b/iu;
const DAILY_PATTERN =
  /\/\s?dia\b|\bpor\s+dia\b|\bdi[áa]rio\b|\bdaily\b|\/\s?day\b/iu;

function detectAction(text: string): AgentAction {
  for (const [action, pattern] of ACTION_PATTERNS) {
    if (pattern.test(text)) return action;
  }
  return "unknown";
}

function detectLevel(text: string): AdObjectLevel {
  for (const [level, pattern] of LEVEL_PATTERNS) {
    if (pattern.test(text)) return level;
  }
  return "unknown";
}

function detectCadence(text: string): BudgetCadence {
  if (DAILY_PATTERN.test(text)) return "daily";
  if (LIFETIME_PATTERN.test(text)) return "lifetime";
  return "unspecified";
}

/** Matches `€50`, `50€`, `50 eur`, `€1.250,50`. */
const BUDGET_PATTERNS = [
  /€\s?(\d+(?:[.\s]\d{3})*(?:[.,]\d{1,2})?)/u,
  /(\d+(?:[.\s]\d{3})*(?:[.,]\d{1,2})?)\s?(?:€|eur\b|euros?\b)/iu,
];

function parseEuroAmount(raw: string): number | undefined {
  // Strip thousands separators, then normalise the decimal comma.
  const normalized = raw
    .replace(/\s/gu, "")
    .replace(/\.(?=\d{3}\b)/gu, "")
    .replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : undefined;
}

function detectBudget(text: string): BudgetHint | undefined {
  for (const pattern of BUDGET_PATTERNS) {
    const match = pattern.exec(text);
    const captured = match?.[1];
    if (!captured) continue;
    const amountEur = parseEuroAmount(captured);
    if (amountEur === undefined) continue;
    return { amountEur, cadence: detectCadence(text) };
  }
  return undefined;
}

const AGE_PATTERN = /\b(\d{2})\s*(?:-|–|a|to|até)\s*(\d{2})\b(?:\s*anos)?/iu;
const FEMALE_PATTERN = /\b(?:mulheres|feminino|women|female)\b/iu;
const MALE_PATTERN = /\b(?:homens|masculino|men|male)\b/iu;

function detectAudience(text: string): AudienceHint | undefined {
  const hint: AudienceHint = {};

  const ageMatch = AGE_PATTERN.exec(text);
  if (ageMatch?.[1] && ageMatch[2]) {
    const min = Number.parseInt(ageMatch[1], 10);
    const max = Number.parseInt(ageMatch[2], 10);
    if (min >= 13 && max >= min && max <= 99) {
      hint.ageMin = min;
      hint.ageMax = max;
    }
  }

  const genders: AudienceHint["genders"] = [];
  if (FEMALE_PATTERN.test(text)) genders.push("female");
  if (MALE_PATTERN.test(text)) genders.push("male");
  if (genders.length > 0) hint.genders = genders;

  return Object.keys(hint).length > 0 ? hint : undefined;
}

/**
 * Lifts capitalised proper nouns that follow a location preposition.
 *
 * These are hints only. Targeting ids are never invented — they are resolved
 * through `GET /{version}/search` before any write.
 */
const LOCATION_PATTERN =
  /\b(?:para|em|no|na|nos|nas|in|to)\s+([A-ZÀ-Ý][\p{L}]+(?:\s+(?:e|and|,)\s*[A-ZÀ-Ý][\p{L}]+)*)/gu;

function detectTargetingHints(text: string): string[] {
  const hints = new Set<string>();
  for (const match of text.matchAll(LOCATION_PATTERN)) {
    const group = match[1];
    if (!group) continue;
    for (const part of group.split(/\s+(?:e|and)\s+|,\s*/u)) {
      const cleaned = part.trim();
      if (cleaned.length > 1) hints.add(cleaned);
    }
  }
  return [...hints];
}

const WINDOW_PATTERN =
  /\b(?:[úu]ltimos?|last|past)\s+(\d{1,3})\s*(?:dias?|days?)\b|\b(\d{1,3})\s*(?:dias?|days?)\b/iu;

function detectWindowDays(text: string): number | undefined {
  const match = WINDOW_PATTERN.exec(text);
  const raw = match?.[1] ?? match?.[2];
  if (!raw) return undefined;
  const days = Number.parseInt(raw, 10);
  return days > 0 && days <= 365 ? days : undefined;
}

function scoreConfidence(action: AgentAction, level: AdObjectLevel): number {
  if (action === "unknown") return 0.2;
  if (level === "unknown") return 0.6;
  return 0.85;
}

/** Parses a natural-language request into the agent's structured intent. */
export function parseIntent(rawText: string): ParsedIntent {
  const text = rawText.trim();
  const action = detectAction(text);
  const level = detectLevel(text);
  const budget = detectBudget(text);
  const audience = detectAudience(text);
  const windowDays = detectWindowDays(text);

  return {
    action,
    level,
    isWrite: WRITE_ACTIONS.has(action),
    ...(budget ? { budget } : {}),
    ...(audience ? { audience } : {}),
    targetingHints: detectTargetingHints(text),
    referencesWinner: WINNER_PATTERN.test(text),
    ...(windowDays !== undefined ? { windowDays } : {}),
    confidence: scoreConfidence(action, level),
    rawText: text,
  };
}
