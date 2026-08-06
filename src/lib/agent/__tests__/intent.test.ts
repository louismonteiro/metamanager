import { describe, expect, it } from "vitest";

import { parseIntent } from "../intent";

describe("parseIntent — action", () => {
  it("reads a creation request", () => {
    const intent = parseIntent(
      "Cria uma campanha de leads com €50/dia para Lisboa e Porto, mulheres 25-45.",
    );

    expect(intent.action).toBe("create");
    expect(intent.level).toBe("campaign");
    expect(intent.isWrite).toBe(true);
  });

  it("reads a duplication request without mistaking 'pausado' for a pause", () => {
    const intent = parseIntent(
      "Duplica a campanha Black Friday para janeiro, com orçamento de €80/dia e tudo pausado.",
    );

    expect(intent.action).toBe("duplicate");
    expect(intent.isWrite).toBe(true);
  });

  it("prefers the write over the reporting it implies", () => {
    const intent = parseIntent("Quais anúncios têm CPC acima de €2? Pausa-os.");

    expect(intent.action).toBe("pause");
    expect(intent.level).toBe("ad");
  });

  it("reads an export request", () => {
    const intent = parseIntent(
      "Exporta os leads do formulário de contacto dos últimos 30 dias em CSV.",
    );

    expect(intent.action).toBe("export");
    expect(intent.level).toBe("lead");
    expect(intent.isWrite).toBe(false);
    expect(intent.windowDays).toBe(30);
  });

  it("reads a read-only performance question", () => {
    const intent = parseIntent("Qual campanha teve o CPA mais baixo em julho?");

    expect(intent.action).toBe("report");
    expect(intent.isWrite).toBe(false);
  });

  it("understands English phrasing too", () => {
    const intent = parseIntent("Pause every ad set with CPC above €2");

    expect(intent.action).toBe("pause");
    expect(intent.level).toBe("adset");
  });

  it("gives up honestly on an unrelated message", () => {
    const intent = parseIntent("bom dia");

    expect(intent.action).toBe("unknown");
    expect(intent.level).toBe("unknown");
    expect(intent.confidence).toBeLessThan(0.5);
  });
});

describe("parseIntent — listing", () => {
  it.each([
    "Que campanhas tenho criadas?",
    "que campanhas tenho",
    "Quais campanhas tenho?",
    "Que campanhas estão ativas?",
    "Mostra-me as minhas campanhas",
    "Lista as campanhas",
    "ver campanhas",
    "Quantas campanhas tenho?",
    "Quero ver campanhas",
    "Tenho campanhas a correr?",
    "Consulta as campanhas da conta",
    "Which campaigns do I have?",
    "Show me my campaigns",
  ])("reads %j as a campaign listing", (text) => {
    const intent = parseIntent(text);

    expect(intent.action).toBe("list");
    expect(intent.level).toBe("campaign");
    expect(intent.isWrite).toBe(false);
    expect(intent.confidence).toBeGreaterThan(0.5);
  });

  it("reads a listing at ad set level", () => {
    const intent = parseIntent("Mostra-me os meus conjuntos de anúncios");

    expect(intent.action).toBe("list");
    expect(intent.level).toBe("adset");
  });

  it("reads a listing at ad level", () => {
    const intent = parseIntent("Que anúncios tenho a correr?");

    expect(intent.action).toBe("list");
    expect(intent.level).toBe("ad");
  });

  it("keeps a metric question as a report, not a listing", () => {
    expect(parseIntent("Mostra o CPA das campanhas").action).toBe("report");
    expect(parseIntent("Quais campanhas têm o CTR mais alto?").action).toBe(
      "report",
    );
    expect(parseIntent("Mostra o gasto da conta").action).toBe("report");
  });

  it("recognises spending verb conjugations as report signals", () => {
    expect(parseIntent("Quanto gastei nas campanhas?").action).toBe("report");
    expect(parseIntent("Quanto gastamos este mês?").action).toBe("report");
    expect(parseIntent("Quanto gastaram as campanhas?").action).toBe("report");
    expect(parseIntent("Quanto gastava por dia?").action).toBe("report");
    expect(parseIntent("Quanto investi nas campanhas?").action).toBe("report");
    expect(parseIntent("Quanto investimos em julho?").action).toBe("report");
    expect(parseIntent("Quanto custou a campanha?").action).toBe("report");
    expect(parseIntent("Qual foi o custo total?").action).toBe("report");
  });

  it("still lets a write outrank the listing it implies", () => {
    expect(parseIntent("Lista as campanhas e pausa as ativas").action).toBe(
      "pause",
    );
    expect(
      parseIntent("Mostra-me as campanhas que quero duplicar").action,
    ).toBe("duplicate");
    expect(
      parseIntent("Cria uma campanha igual às campanhas que tenho").action,
    ).toBe("create");
  });

  it("needs an object to read a listing: a bare verb stays a report", () => {
    expect(parseIntent("mostra-me isso").action).not.toBe("list");
    expect(parseIntent("bom dia").action).toBe("unknown");
  });
});

describe("parseIntent — level", () => {
  it("prefers ad set over ad when both words appear", () => {
    expect(parseIntent("Pausa o conjunto de anúncios X").level).toBe("adset");
  });

  it("recognises the ad level", () => {
    expect(parseIntent("Duplica o anúncio vencedor").level).toBe("ad");
  });
});

describe("parseIntent — budget", () => {
  it("reads a daily euro budget written before the unit", () => {
    const intent = parseIntent("Cria uma campanha com €50/dia");
    expect(intent.budget).toEqual({ amountEur: 50, cadence: "daily" });
  });

  it("reads a euro budget written after the amount", () => {
    const intent = parseIntent("Cria uma campanha com 80 eur por dia");
    expect(intent.budget).toEqual({ amountEur: 80, cadence: "daily" });
  });

  it("reads decimal comma and thousands separator", () => {
    const intent = parseIntent("Sobe o orçamento total para €1.250,50");
    expect(intent.budget?.amountEur).toBe(1250.5);
    expect(intent.budget?.cadence).toBe("lifetime");
  });

  it("leaves the cadence unspecified when the text does not say", () => {
    expect(parseIntent("Cria uma campanha com €30").budget?.cadence).toBe(
      "unspecified",
    );
  });

  it("reports no budget when none is mentioned", () => {
    expect(parseIntent("Cria uma campanha de leads").budget).toBeUndefined();
  });
});

describe("parseIntent — audience and targeting", () => {
  it("reads an age range and gender", () => {
    const intent = parseIntent("Cria um ad set para mulheres 25-45 em Lisboa");

    expect(intent.audience?.ageMin).toBe(25);
    expect(intent.audience?.ageMax).toBe(45);
    expect(intent.audience?.genders).toEqual(["female"]);
  });

  it("rejects an implausible age range", () => {
    expect(
      parseIntent("Cria um ad set 45-25").audience?.ageMin,
    ).toBeUndefined();
  });

  it("lifts location hints after a preposition", () => {
    const intent = parseIntent(
      "Cria uma campanha para Lisboa e Porto com €50/dia",
    );

    expect(intent.targetingHints).toContain("Lisboa");
    expect(intent.targetingHints).toContain("Porto");
  });

  it("does not invent hints when no proper noun follows", () => {
    expect(
      parseIntent("Cria uma campanha para janeiro").targetingHints,
    ).toEqual([]);
  });
});

describe("parseIntent — winner reference", () => {
  it("detects the trophy badge", () => {
    expect(
      parseIntent("Duplica o meu anúncio vencedor 🏆").referencesWinner,
    ).toBe(true);
  });

  it("detects the word in Portuguese and English", () => {
    expect(parseIntent("Usa o anúncio vencedor").referencesWinner).toBe(true);
    expect(parseIntent("Duplicate my winner ad").referencesWinner).toBe(true);
  });

  it("is false for an ordinary request", () => {
    expect(parseIntent("Cria uma campanha").referencesWinner).toBe(false);
  });
});
