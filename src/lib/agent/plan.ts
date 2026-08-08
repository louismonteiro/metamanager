import type { AdObjectLevel, AgentPlan, ParsedIntent, PlanStep } from "./types";

/**
 * Turns a parsed intent into a readable plan of Meta Marketing API calls.
 *
 * The plan is shown to the user before anything runs. In this slice nothing is
 * executed at all — the plan is the deliverable, and it doubles as the contract
 * the LLM tool layer will fill in later.
 */

/** Placeholder ids. Real ids only ever come from listings or `GET /search`. */
const ACCOUNT = "act_{AD_ACCOUNT_ID}";

const LEVEL_LABEL: Record<AdObjectLevel, string> = {
  campaign: "campanha",
  adset: "ad set",
  ad: "anúncio",
  account: "conta",
  lead: "leads",
  unknown: "objeto",
};

const LEVEL_PLURAL: Record<AdObjectLevel, string> = {
  campaign: "campanhas",
  adset: "ad sets",
  ad: "anúncios",
  account: "contas",
  lead: "leads",
  unknown: "objetos",
};

const LEVEL_ID: Record<AdObjectLevel, string> = {
  campaign: "{CAMPAIGN_ID}",
  adset: "{ADSET_ID}",
  ad: "{AD_ID}",
  account: ACCOUNT,
  lead: "{FORM_ID}",
  unknown: "{OBJECT_ID}",
};

const LEVEL_EDGE: Record<AdObjectLevel, string> = {
  campaign: "campaigns",
  adset: "adsets",
  ad: "ads",
  account: "adaccounts",
  lead: "leads",
  unknown: "campaigns",
};

/** A step before its position in the plan is known. */
type StepDraft = Omit<PlanStep, "order">;

/** Every plan resolves the account first: the ad account and its currency. */
function contextSteps(): StepDraft[] {
  return [
    {
      summary: "Resolver a conta de anúncio e validar a moeda (EUR)",
      method: "GET",
      endpoint: `${ACCOUNT}?fields=id,name,currency,account_status,spend_cap`,
      dryRun: false,
      note: "O produto opera exclusivamente em EUR.",
    },
  ];
}

function createSteps(level: AdObjectLevel, intent: ParsedIntent): StepDraft[] {
  const budgetNote = intent.budget
    ? `Orçamento ${intent.budget.cadence === "lifetime" ? "total" : "diário"} de €${intent.budget.amountEur}`
    : "Orçamento por confirmar";

  const full: StepDraft[] = [
    {
      summary: `Criar a campanha (objetivo OUTCOME_*, ${budgetNote})`,
      method: "POST",
      endpoint: `${ACCOUNT}/campaigns`,
      dryRun: true,
      note: "special_ad_categories é obrigatório, mesmo quando vazio.",
    },
    {
      summary: "Criar o ad set (optimization_goal, bidding, targeting)",
      method: "POST",
      endpoint: `${ACCOUNT}/adsets`,
      dryRun: true,
    },
    {
      summary: "Criar o criativo e o anúncio ligado ao ad set",
      method: "POST",
      endpoint: `${ACCOUNT}/adcreatives → ${ACCOUNT}/ads`,
      dryRun: true,
    },
  ];

  if (level === "campaign") return full.slice(0, 1);
  if (level === "adset") return full.slice(1, 2);
  if (level === "ad") return full.slice(2);
  return full;
}

function planSteps(intent: ParsedIntent): StepDraft[] {
  const level = intent.level === "unknown" ? "campaign" : intent.level;
  const id = LEVEL_ID[level];
  const label = LEVEL_LABEL[level];
  const plural = LEVEL_PLURAL[level];

  switch (intent.action) {
    case "create":
      return createSteps(intent.level, intent);

    case "duplicate":
      return [
        {
          summary: intent.referencesWinner
            ? `Localizar o anúncio vencedor 🏆 a usar como base`
            : `Localizar a ${label} de origem`,
          method: "GET",
          endpoint: `${ACCOUNT}/${LEVEL_EDGE[level]}?fields=id,name,status`,
          dryRun: false,
        },
        {
          summary: `Duplicar a ${label} com os ajustes pedidos`,
          method: "POST",
          endpoint: `${id}/copies`,
          dryRun: true,
          note: "Duplicações profundas correm de forma assíncrona.",
        },
      ];

    case "pause":
    case "resume": {
      const status = intent.action === "pause" ? "PAUSED" : "ACTIVE";
      return [
        {
          summary: `Listar as ${plural} alvo e confirmar quais são afetadas`,
          method: "GET",
          endpoint: `${ACCOUNT}/${LEVEL_EDGE[level]}?fields=id,name,status,effective_status`,
          dryRun: false,
        },
        {
          summary: `Definir status=${status} em cada objeto selecionado`,
          method: "POST",
          endpoint: id,
          dryRun: true,
        },
      ];
    }

    case "update_budget":
      return [
        {
          summary: `Ler o orçamento atual da ${label}`,
          method: "GET",
          endpoint: `${id}?fields=id,name,daily_budget,lifetime_budget`,
          dryRun: false,
        },
        {
          summary: intent.budget
            ? `Definir orçamento ${intent.budget.cadence === "lifetime" ? "total" : "diário"} de €${intent.budget.amountEur}`
            : "Definir o novo orçamento (valor por confirmar)",
          method: "POST",
          endpoint: id,
          dryRun: true,
          note: "Valores em EUR são enviados em cêntimos (menor unidade).",
        },
      ];

    case "export":
      return [
        {
          summary: `Exportar os leads do período${intent.windowDays ? ` (${intent.windowDays} dias)` : ""}`,
          method: "GET",
          endpoint: "{FORM_ID}/leads?fields=created_time,field_data",
          dryRun: false,
          note: "Requer a permissão leads_retrieval.",
        },
      ];

    case "preview":
      return [
        {
          summary: "Gerar previews em Facebook Feed, Instagram Feed e Stories",
          method: "GET",
          endpoint: `${ACCOUNT}/generatepreviews?ad_format=DESKTOP_FEED_STANDARD`,
          dryRun: false,
        },
      ];

    case "list": {
      const steps: StepDraft[] = [
        {
          summary: `Listar as ${plural} da conta com estado e ${level === "adset" ? "orçamento" : level === "campaign" ? "orçamento" : "criativo"}`,
          method: "GET",
          endpoint: `${ACCOUNT}/${LEVEL_EDGE[level]}?fields=id,name,status,effective_status${
            level === "campaign"
              ? ",objective,daily_budget,lifetime_budget"
              : level === "adset"
                ? ",daily_budget,lifetime_budget,optimization_goal,billing_event,targeting,start_time,end_time"
                : ",creative,preview_url"
          }`,
          dryRun: false,
          note:
            level === "campaign" || level === "adset"
              ? "Orçamentos vêm em cêntimos (menor unidade da moeda da conta)."
              : "O criativo inclui texto, imagem/vídeo e link.",
        },
      ];

      // Spend is a second, independent call: insights are throttled apart from
      // the object edges, so losing them costs the column, not the listing.
      if (level === "campaign") {
        steps.push({
          summary: "Ler o gasto acumulado por campanha",
          method: "GET",
          endpoint: `${ACCOUNT}/insights?level=campaign&fields=campaign_id,spend&date_preset=maximum`,
          dryRun: false,
          note: "Falha aqui não invalida a listagem — apenas o gasto fica por apurar.",
        });
      }

      return steps;
    }

    case "report":
      return [
        {
          summary: `Ler as métricas da ${label}${intent.windowDays ? ` nos últimos ${intent.windowDays} dias` : ""}`,
          method: "GET",
          endpoint: `${id}/insights?fields=impressions,spend,clicks,ctr,cpc,actions,cost_per_action_type`,
          dryRun: false,
          note: "Insights atualizam a cada 15 minutos; o dashboard lê de cache.",
        },
        {
          summary:
            "Ler a tendência diária para detetar subida de CPA e queda de CTR",
          method: "GET",
          endpoint: `${id}/insights?time_increment=1`,
          dryRun: false,
        },
      ];

    case "unknown":
    default:
      return [];
  }
}

function buildWarnings(intent: ParsedIntent): string[] {
  const warnings: string[] = [];

  if (intent.action === "unknown") {
    warnings.push(
      "Não consegui identificar a operação pedida. Reformula indicando a ação (criar, duplicar, pausar, consultar…).",
    );
  }
  if (intent.level === "unknown" && intent.action !== "unknown") {
    warnings.push(
      "O nível do objeto (campanha, ad set ou anúncio) não ficou explícito — vou assumir campanha.",
    );
  }
  if (intent.targetingHints.length > 0) {
    warnings.push(
      `Localizações a resolver via GET /search antes de qualquer escrita: ${intent.targetingHints.join(", ")}.`,
    );
  }
  if (intent.referencesWinner) {
    warnings.push(
      "A marcação de anúncios vencedores 🏆 ainda não está implementada nesta fase.",
    );
  }
  if (intent.isWrite && !intent.budget && intent.action === "create") {
    warnings.push("Nenhum orçamento em EUR foi indicado no pedido.");
  }

  return warnings;
}

/** Builds the confirmation-gated plan for a parsed intent. */
export function buildPlan(intent: ParsedIntent): AgentPlan {
  const drafts = planSteps(intent);
  const steps: PlanStep[] =
    drafts.length > 0
      ? [...contextSteps(), ...drafts].map((step, index) => ({
          ...step,
          order: index + 1,
        }))
      : [];

  return {
    steps,
    requiresConfirmation: intent.isWrite,
    warnings: buildWarnings(intent),
  };
}
