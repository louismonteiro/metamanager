import { z } from "zod";
import { formatEur } from "@/lib/format";
import {
  adSetStatusLabel,
  adStatusLabel,
  campaignStatusLabel,
  type MetaApiClientOptions,
  type MetaApiEnv,
} from "@/lib/meta-api";
import {
  fetchAdListing,
  fetchAdSetListing,
  fetchCampaignListing,
} from "./listing";
import { parseIntent } from "./intent";
import { buildPlan } from "./plan";
import type {
  AdObjectLevel,
  AdSetListing,
  AdSetSummary,
  AdListing,
  AdSummary,
  AgentAction,
  AgentPlan,
  AgentReply,
  CampaignListing,
  CampaignSummary,
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
  list: "listar",
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

function describePlan(plan: AgentPlan, executed: boolean): string[] {
  if (plan.steps.length === 0) {
    return [
      "",
      "**Plano**",
      "- Sem plano: preciso de perceber melhor o pedido antes de propor chamadas à API.",
    ];
  }

  const lines = ["", executed ? "**Leitura efetuada**" : "**Plano proposto**"];
  for (const step of plan.steps) {
    const dryRun = step.dryRun ? " · dry-run `validate_only`" : "";
    lines.push(`${step.order}. ${step.summary}`);
    lines.push(`   \`${step.method} ${step.endpoint}\`${dryRun}`);
    if (step.note) lines.push(`   ↳ ${step.note}`);
  }
  return lines;
}

function describeGuards(plan: AgentPlan, executed: boolean): string[] {
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
    executed
      ? "_Leitura executada em direto contra a Meta Marketing API. Escritas continuam a exigir confirmação._"
      : "_Motor de raciocínio ainda não ligado: este plano vem de análise determinística do pedido, não de um LLM, e nenhuma chamada foi executada._",
  );

  return lines;
}

function describeBudget(campaign: CampaignSummary): string {
  if (campaign.dailyBudgetEur !== undefined) {
    return `orçamento ${formatEur(campaign.dailyBudgetEur)}/dia`;
  }
  if (campaign.lifetimeBudgetEur !== undefined) {
    return `orçamento total ${formatEur(campaign.lifetimeBudgetEur)}`;
  }
  // Not a gap in the data: without Advantage campaign budget the money is set
  // on the ad sets, and the campaign node carries no budget at all.
  return "sem orçamento na campanha (definido nos ad sets)";
}

function describeCampaign(campaign: CampaignSummary, position: number): string {
  const parts = [campaign.statusLabel, describeBudget(campaign)];

  if (campaign.spendEur !== undefined) {
    parts.push(`gasto ${formatEur(campaign.spendEur)}`);
  }
  if (campaign.effectiveStatus) {
    parts.push(`entrega: ${campaignStatusLabel(campaign.effectiveStatus)}`);
  }

  return `${position}. **${campaign.name}** — ${parts.join(" · ")}`;
}

function describeAdSet(adSet: AdSetSummary, position: number): string {
  const parts = [adSet.statusLabel];

  if (adSet.dailyBudgetEur !== undefined) {
    parts.push(`orçamento ${formatEur(adSet.dailyBudgetEur)}/dia`);
  } else if (adSet.lifetimeBudgetEur !== undefined) {
    parts.push(`orçamento total ${formatEur(adSet.lifetimeBudgetEur)}`);
  }

  if (adSet.optimizationGoal) {
    parts.push(`objetivo: ${adSet.optimizationGoal}`);
  }
  if (adSet.geoLocations) {
    parts.push(`localização: ${adSet.geoLocations}`);
  }
  if (adSet.ageMin && adSet.ageMax) {
    parts.push(`idade: ${adSet.ageMin}-${adSet.ageMax}`);
  }
  if (adSet.startTime || adSet.endTime) {
    const dates = [adSet.startTime, adSet.endTime].filter(Boolean).join(" → ");
    if (dates) parts.push(`datas: ${dates}`);
  }
  if (adSet.effectiveStatus) {
    parts.push(`entrega: ${adSetStatusLabel(adSet.effectiveStatus)}`);
  }

  return `${position}. **${adSet.name}** — ${parts.join(" · ")}`;
}

function describeAd(ad: AdSummary, position: number): string {
  const parts = [ad.statusLabel];

  if (ad.creativeHeadline) {
    parts.push(`headline: ${ad.creativeHeadline}`);
  }
  if (ad.creativeImageUrl) {
    parts.push("com imagem");
  }
  if (ad.creativeVideoUrl) {
    parts.push("com vídeo");
  }
  if (ad.creativeLinkUrl) {
    parts.push("com link");
  }
  if (ad.effectiveStatus) {
    parts.push(`entrega: ${adStatusLabel(ad.effectiveStatus)}`);
  }

  return `${position}. **${ad.name}** — ${parts.join(" · ")}`;
}

function describeAdSetListing(listing: AdSetListing): string[] {
  const lines = ["**Os teus ad sets**", ""];

  switch (listing.status) {
    case "ok": {
      if (listing.totalCount === 0) {
        lines.push(
          `Não existe nenhum ad set na conta **${listing.accountName}** (${listing.accountId}).`,
        );
        return lines;
      }

      const plural = listing.totalCount === 1 ? "ad set" : "ad sets";
      lines.push(
        `Tens **${listing.totalCount} ${plural}** na conta **${listing.accountName}** (${listing.accountId})${
          listing.hasMore ? ", e existem mais páginas por ler" : ""
        }:`,
        "",
      );

      listing.adSets.forEach((adSet, index) => {
        lines.push(describeAdSet(adSet, index + 1));
      });

      return lines;
    }

    case "unconfigured":
      lines.push(
        `Não consigo ler os ad sets: a ligação à Meta não está configurada (${listing.reason}).`,
      );
      return lines;

    case "no_account":
      lines.push(`Não consigo ler os ad sets: ${listing.reason}`);
      return lines;

    case "error":
      lines.push(
        `Não consegui ler os ad sets: ${listing.message}${
          listing.code !== undefined ? ` (código ${listing.code})` : ""
        }.`,
      );
      return lines;
  }
}

function describeAdListing(listing: AdListing): string[] {
  const lines = ["**Os teus anúncios**", ""];

  switch (listing.status) {
    case "ok": {
      if (listing.totalCount === 0) {
        lines.push(
          `Não existe nenhum anúncio na conta **${listing.accountName}** (${listing.accountId}).`,
        );
        return lines;
      }

      const plural = listing.totalCount === 1 ? "anúncio" : "anúncios";
      lines.push(
        `Tens **${listing.totalCount} ${plural}** na conta **${listing.accountName}** (${listing.accountId})${
          listing.hasMore ? ", e existem mais páginas por ler" : ""
        }:`,
        "",
      );

      listing.ads.forEach((ad, index) => {
        lines.push(describeAd(ad, index + 1));
      });

      return lines;
    }

    case "unconfigured":
      lines.push(
        `Não consigo ler os anúncios: a ligação à Meta não está configurada (${listing.reason}).`,
      );
      return lines;

    case "no_account":
      lines.push(`Não consigo ler os anúncios: ${listing.reason}`);
      return lines;

    case "error":
      lines.push(
        `Não consegui ler os anúncios: ${listing.message}${
          listing.code !== undefined ? ` (código ${listing.code})` : ""
        }.`,
      );
      return lines;
  }
}

/** Renders the campaigns actually read from the account, or why they were not. */
function describeListing(listing: CampaignListing): string[] {
  const lines = ["**As tuas campanhas**", ""];

  switch (listing.status) {
    case "ok": {
      if (listing.totalCount === 0) {
        lines.push(
          `Não existe nenhuma campanha na conta **${listing.accountName}** (${listing.accountId}).`,
        );
        return lines;
      }

      const plural = listing.totalCount === 1 ? "campanha" : "campanhas";
      lines.push(
        `Tens **${listing.totalCount} ${plural}** na conta **${listing.accountName}** (${listing.accountId})${
          listing.hasMore ? ", e existem mais páginas por ler" : ""
        }:`,
        "",
      );

      listing.campaigns.forEach((campaign, index) => {
        lines.push(describeCampaign(campaign, index + 1));
      });

      if (listing.spendUnavailable) {
        lines.push(
          "",
          "_O gasto por campanha não ficou disponível nesta leitura (insights indisponíveis ou limitados); os orçamentos acima vêm da própria campanha._",
        );
      }
      return lines;
    }

    case "unconfigured":
      lines.push(
        `Não consigo ler as campanhas: a ligação à Meta não está configurada (${listing.reason}). Define \`META_ACCESS_TOKEN\` no servidor e repete o pedido.`,
      );
      return lines;

    case "no_account":
      lines.push(`Não consigo ler as campanhas: ${listing.reason}`);
      return lines;

    case "error":
      lines.push(
        `Não consegui ler as campanhas: ${listing.message}${
          listing.code !== undefined ? ` (código ${listing.code})` : ""
        }.`,
      );
      return lines;
  }
}

/** Renders the assistant's message body for a parsed intent and its plan. */
export function renderReply(
  intent: ParsedIntent,
  plan: AgentPlan,
  listing?: AnyListing,
): string {
  const executed = listing?.status === "ok";

  // A listing request is answered with the answer first: the plan behind it is
  // supporting detail, not the deliverable.
  const listingLines = listing
    ? listing.status === "ok" && intent.level === "adset"
      ? describeAdSetListing(listing as AdSetListing)
      : listing.status === "ok" && intent.level === "ad"
        ? describeAdListing(listing as AdListing)
        : describeListing(listing as CampaignListing)
    : [];

  return [
    ...(listingLines.length > 0 ? [...listingLines, ""] : []),
    ...describeIntent(intent),
    ...describePlan(plan, executed),
    ...describeGuards(plan, executed),
  ].join("\n");
}

function newId(): string {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface RespondOptions {
  env?: MetaApiEnv;
  clientOptions?: MetaApiClientOptions;
  /** Injected so tests answer a listing without touching the network. */
  fetchListing?: () => Promise<CampaignListing>;
}

type AnyListing = CampaignListing | AdSetListing | AdListing;

/** Checks if the intent is an executable listing request. */
function isExecutableListing(
  intent: ParsedIntent,
): intent is ParsedIntent & { action: "list" } {
  return (
    intent.action === "list" &&
    (intent.level === "campaign" ||
      intent.level === "adset" ||
      intent.level === "ad")
  );
}

/**
 * Answers a user message.
 *
 * Reads are executed: a listing request is answered with the account's real
 * campaigns, ad sets or ads. Writes are still only planned — the brain that
 * decides how to carry them out is not wired in, and nothing writes without an
 * explicit confirmation.
 */
export async function respondToMessage(
  rawMessage: string,
  options: RespondOptions = {},
): Promise<AgentReply> {
  const intent = parseIntent(rawMessage);
  const plan = buildPlan(intent);

  let listing: AnyListing | undefined;

  if (isExecutableListing(intent)) {
    if (intent.level === "campaign") {
      listing = await fetchCampaignListing(options.env, options.clientOptions);
    } else if (intent.level === "adset") {
      listing = await fetchAdSetListing(options.env, options.clientOptions);
    } else if (intent.level === "ad") {
      listing = await fetchAdListing(options.env, options.clientOptions);
    }
  }

  return {
    message: {
      id: newId(),
      role: "assistant",
      content: renderReply(
        intent,
        plan,
        listing as CampaignListing | undefined,
      ),
      createdAt: new Date().toISOString(),
    },
    intent,
    plan,
    ...(listing ? { listing } : {}),
    engine:
      listing && "status" in listing && listing.status === "ok"
        ? "meta-api"
        : "placeholder",
  };
}
