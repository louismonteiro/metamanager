import { z } from "zod";
import { formatEur } from "@/lib/format";
import { parseIntent } from "./intent";
import { buildPlan } from "./plan";
import type {
  AdObjectLevel,
  AgentAction,
  AgentPlan,
  AgentReply,
  ParsedIntent,
} from "./types";

export const MAX_MESSAGE_LENGTH = 4000;

export const chatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "A mensagem não pode estar vazia")
    .max(MAX_MESSAGE_LENGTH, `Máximo de ${MAX_MESSAGE_LENGTH} caracteres`),
  /** Prior turns, oldest first. Kept for when the LLM brain lands. */
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(50)
    .optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

const ACTION_LABEL: Record<AgentAction, string> = {
  create: "criar",
  duplicate: "duplicar",
  pause: "pausar",
  resume: "reativar",
  update_budget: "alterar orçamento",
  export: "exportar",
  preview: "pré-visualizar",
  report: "consultar métricas",
  unknown: "não identificada",
};

const LEVEL_LABEL: Record<AdObjectLevel, string> = {
  campaign: "campanha",
  adset: "ad set",
  ad: "anúncio",
  account: "conta",
  lead: "leads",
  unknown: "não identificado",
};

function describeIntent(intent: ParsedIntent): string[] {
  const lines = [
    `**Intenção lida**`,
    `- Ação: ${ACTION_LABEL[intent.action]}`,
    `- Nível: ${LEVEL_LABEL[intent.level]}`,
  ];

  if (intent.budget) {
    const cadence =
      intent.budget.cadence === "lifetime"
        ? "total"
        : intent.budget.cadence === "daily"
          ? "diário"
          : "sem cadência definida";
    lines.push(
      `- Orçamento: ${formatEur(intent.budget.amountEur)} (${cadence})`,
    );
  }
  if (intent.audience?.ageMin && intent.audience.ageMax) {
    lines.push(`- Idade: ${intent.audience.ageMin}-${intent.audience.ageMax}`);
  }
  if (intent.audience?.genders?.length) {
    lines.push(
      `- Género: ${intent.audience.genders
        .map((g) => (g === "female" ? "mulheres" : "homens"))
        .join(", ")}`,
    );
  }
  if (intent.targetingHints.length > 0) {
    lines.push(
      `- Localizações candidatas: ${intent.targetingHints.join(", ")}`,
    );
  }
  if (intent.windowDays !== undefined) {
    lines.push(`- Janela: ${intent.windowDays} dias`);
  }
  if (intent.referencesWinner) {
    lines.push(`- Refere um anúncio vencedor 🏆`);
  }

  return lines;
}

function describePlan(plan: AgentPlan): string[] {
  if (plan.steps.length === 0) {
    return [
      "",
      "**Plano**",
      "- Sem plano: preciso de perceber melhor o pedido antes de propor chamadas à API.",
    ];
  }

  const lines = ["", "**Plano proposto**"];
  for (const step of plan.steps) {
    const dryRun = step.dryRun ? " · dry-run `validate_only`" : "";
    lines.push(`${step.order}. ${step.summary}`);
    lines.push(`   \`${step.method} ${step.endpoint}\`${dryRun}`);
    if (step.note) lines.push(`   ↳ ${step.note}`);
  }
  return lines;
}

function describeGuards(plan: AgentPlan): string[] {
  const lines: string[] = [];

  if (plan.warnings.length > 0) {
    lines.push("", "**Notas**");
    for (const warning of plan.warnings) lines.push(`- ${warning}`);
  }

  lines.push("");
  lines.push(
    plan.requiresConfirmation
      ? "⚠️ Esta operação escreve na conta. Nada é executado sem a tua confirmação explícita."
      : "ℹ️ Operação apenas de leitura.",
  );
  lines.push(
    "_Motor de raciocínio ainda não ligado: este plano vem de análise determinística do pedido, não de um LLM, e nenhuma chamada foi executada._",
  );

  return lines;
}

/** Renders the assistant's message body for a parsed intent and its plan. */
export function renderReply(intent: ParsedIntent, plan: AgentPlan): string {
  return [
    ...describeIntent(intent),
    ...describePlan(plan),
    ...describeGuards(plan),
  ].join("\n");
}

function newId(): string {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Answers a user message.
 *
 * Placeholder brain: it parses the request, restates it in structured form and
 * proposes the plan of API calls. Real LLM tool calling replaces the body of
 * this function without changing its signature.
 */
export function respondToMessage(rawMessage: string): AgentReply {
  const intent = parseIntent(rawMessage);
  const plan = buildPlan(intent);

  return {
    message: {
      id: newId(),
      role: "assistant",
      content: renderReply(intent, plan),
      createdAt: new Date().toISOString(),
    },
    intent,
    plan,
    engine: "placeholder",
  };
}
