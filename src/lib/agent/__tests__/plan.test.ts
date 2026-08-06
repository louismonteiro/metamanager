import { describe, expect, it, vi } from "vitest";

import { parseIntent } from "../intent";
import { buildPlan } from "../plan";
import { respondToMessage } from "../respond";

function planFor(text: string) {
  return buildPlan(parseIntent(text));
}

describe("buildPlan", () => {
  it("always resolves the account and its currency first", () => {
    const plan = planFor("Cria uma campanha de leads com €50/dia");

    expect(plan.steps[0]?.order).toBe(1);
    expect(plan.steps[0]?.method).toBe("GET");
    expect(plan.steps[0]?.endpoint).toContain("currency");
  });

  it("gates every write behind confirmation", () => {
    expect(planFor("Cria uma campanha de leads").requiresConfirmation).toBe(
      true,
    );
    expect(planFor("Pausa este anúncio").requiresConfirmation).toBe(true);
  });

  it("does not gate a read-only request", () => {
    expect(
      planFor("Qual campanha teve o CPA mais baixo?").requiresConfirmation,
    ).toBe(false);
  });

  it("marks every write step as a dry-run first", () => {
    const plan = planFor("Cria uma campanha de leads com €50/dia");
    const writes = plan.steps.filter((step) => step.method === "POST");

    expect(writes.length).toBeGreaterThan(0);
    expect(writes.every((step) => step.dryRun)).toBe(true);
  });

  it("never marks a read step as a dry-run", () => {
    const plan = planFor("Mostra as métricas desta campanha");
    expect(plan.steps.every((step) => !step.dryRun)).toBe(true);
  });

  it("plans the full stack when the level is not stated", () => {
    const plan = planFor("Cria tudo com €50/dia");
    const endpoints = plan.steps.map((step) => step.endpoint).join(" ");

    expect(endpoints).toContain("/campaigns");
    expect(endpoints).toContain("/adsets");
    expect(endpoints).toContain("/ads");
  });

  it("plans only the campaign when the level is explicit", () => {
    const plan = planFor("Cria uma campanha de leads com €50/dia");
    const endpoints = plan.steps.map((step) => step.endpoint).join(" ");

    expect(endpoints).toContain("/campaigns");
    expect(endpoints).not.toContain("/adsets");
  });

  it("uses the copies edge for a duplication", () => {
    const plan = planFor("Duplica a campanha Black Friday");
    expect(plan.steps.some((step) => step.endpoint.endsWith("/copies"))).toBe(
      true,
    );
  });

  it("produces no plan when the intent is unreadable", () => {
    const plan = planFor("bom dia");

    expect(plan.steps).toEqual([]);
    expect(plan.warnings[0]).toContain("Não consegui identificar");
  });

  it("warns that location hints must be resolved before writing", () => {
    const plan = planFor("Cria uma campanha para Lisboa com €50/dia");
    expect(plan.warnings.join(" ")).toContain("GET /search");
  });

  it("warns that winner marking is not implemented yet", () => {
    const plan = planFor("Duplica o meu anúncio vencedor 🏆");
    expect(plan.warnings.join(" ")).toContain("vencedores");
  });

  it("warns when a creation carries no budget", () => {
    const plan = planFor("Cria uma campanha de leads");
    expect(plan.warnings.join(" ")).toContain("orçamento");
  });
});

describe("buildPlan — listing", () => {
  it("reads the campaigns edge of the account", () => {
    const plan = planFor("Que campanhas tenho criadas?");
    const listStep = plan.steps.find((step) =>
      step.endpoint.includes("/campaigns"),
    );

    expect(plan.requiresConfirmation).toBe(false);
    expect(listStep?.method).toBe("GET");
    expect(listStep?.endpoint).toContain("status");
    expect(listStep?.endpoint).toContain("daily_budget");
    expect(plan.steps.every((step) => !step.dryRun)).toBe(true);
  });

  it("adds an independent insights call for campaign spend", () => {
    const endpoints = planFor("Lista as minhas campanhas")
      .steps.map((step) => step.endpoint)
      .join(" ");

    expect(endpoints).toContain("insights?level=campaign");
  });

  it("reads the ad sets edge when the request is about ad sets", () => {
    const endpoints = planFor("Mostra-me os meus conjuntos de anúncios")
      .steps.map((step) => step.endpoint)
      .join(" ");

    expect(endpoints).toContain("/adsets");
    expect(endpoints).not.toContain("insights?level=campaign");
  });

  it("warns that only campaigns are read live", () => {
    expect(planFor("Lista os meus anúncios").warnings.join(" ")).toContain(
      "apenas ao nível de campanha",
    );
    expect(
      planFor("Lista as minhas campanhas").warnings.join(" "),
    ).not.toContain("apenas ao nível de campanha");
  });
});

describe("respondToMessage", () => {
  it("returns an assistant message with the intent and plan attached", async () => {
    const reply = await respondToMessage(
      "Cria uma campanha de leads com €50/dia para Lisboa e Porto, mulheres 25-45.",
    );

    expect(reply.message.role).toBe("assistant");
    expect(reply.engine).toBe("placeholder");
    expect(reply.intent.action).toBe("create");
    expect(reply.plan.requiresConfirmation).toBe(true);
  });

  it("restates the budget in euros and flags the write", async () => {
    const reply = await respondToMessage("Cria uma campanha com €50/dia");

    expect(reply.message.content).toContain("50");
    expect(reply.message.content).toContain("confirmação");
  });

  it("says plainly that no LLM produced the plan", async () => {
    const reply = await respondToMessage("Mostra o gasto da conta");
    expect(reply.message.content).toContain("não ligado");
  });

  it("gives each message a distinct id", async () => {
    const first = await respondToMessage("Cria uma campanha");
    const second = await respondToMessage("Cria uma campanha");

    expect(first.message.id).not.toBe(second.message.id);
  });

  it("does not touch the API for a request that is not a campaign listing", async () => {
    const fetchListing = vi.fn();

    const reply = await respondToMessage("Cria uma campanha", {
      fetchListing,
    });

    expect(fetchListing).not.toHaveBeenCalled();
    expect(reply.listing).toBeUndefined();
  });
});
