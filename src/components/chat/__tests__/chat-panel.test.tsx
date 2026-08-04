import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChatPanel, type SendMessage } from "../chat-panel";
import type { SendMessageResult } from "@/app/chat/actions";

let replyCounter = 0;

function reply(content: string): SendMessageResult {
  replyCounter += 1;
  return {
    ok: true,
    reply: {
      message: {
        id: `assistant-${replyCounter}`,
        role: "assistant",
        content,
        createdAt: "2026-08-01T09:00:00.000Z",
      },
      intent: {
        action: "create",
        level: "campaign",
        isWrite: true,
        targetingHints: [],
        referencesWinner: false,
        confidence: 0.85,
        rawText: "",
      },
      plan: { steps: [], requiresConfirmation: true, warnings: [] },
      engine: "placeholder",
    },
  };
}

/** Defers the resolution so the loading state can be observed. */
function deferred(): {
  promise: Promise<SendMessageResult>;
  resolve: (value: SendMessageResult) => void;
} {
  let resolve!: (value: SendMessageResult) => void;
  const promise = new Promise<SendMessageResult>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("ChatPanel", () => {
  it("shows the suggestions before the first message", () => {
    render(<ChatPanel sendMessage={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /Cria uma campanha de leads/ }),
    ).toBeInTheDocument();
  });

  it("appends the user message and the agent reply to the history", async () => {
    const user = userEvent.setup();
    const sendMessage = vi
      .fn<SendMessage>()
      .mockResolvedValue(reply("Plano proposto"));

    render(<ChatPanel sendMessage={sendMessage} />);

    await user.type(
      screen.getByLabelText("Mensagem para o agente"),
      "Cria uma campanha",
    );
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => {
      expect(screen.getByText("Plano proposto")).toBeInTheDocument();
    });
    expect(screen.getByText("Cria uma campanha")).toBeInTheDocument();
    expect(sendMessage).toHaveBeenCalledWith({
      message: "Cria uma campanha",
      history: [],
    });
  });

  it("sends the prior turns as history", async () => {
    const user = userEvent.setup();
    // A fresh reply per call, so each assistant message gets its own id.
    const sendMessage = vi
      .fn<SendMessage>()
      .mockImplementation(async () => reply("resposta"));

    render(<ChatPanel sendMessage={sendMessage} />);
    const composer = screen.getByLabelText("Mensagem para o agente");

    await user.type(composer, "primeira");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));

    await user.type(composer, "segunda");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(2));

    expect(sendMessage.mock.calls[1]?.[0].history).toEqual([
      { role: "user", content: "primeira" },
      { role: "assistant", content: "resposta" },
    ]);
  });

  it("shows a loading state while the agent is thinking", async () => {
    const user = userEvent.setup();
    const pending = deferred();
    const sendMessage = vi.fn<SendMessage>().mockReturnValue(pending.promise);

    render(<ChatPanel sendMessage={sendMessage} />);

    await user.type(
      screen.getByLabelText("Mensagem para o agente"),
      "Cria uma campanha",
    );
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByTestId("chat-loading")).toBeInTheDocument();

    pending.resolve(reply("pronto"));

    await waitFor(() => {
      expect(screen.queryByTestId("chat-loading")).not.toBeInTheDocument();
    });
  });

  it("surfaces a rejected request as an alert", async () => {
    const user = userEvent.setup();
    const sendMessage = vi
      .fn<SendMessage>()
      .mockResolvedValue({ ok: false, error: "Pedido inválido" });

    render(<ChatPanel sendMessage={sendMessage} />);

    await user.type(screen.getByLabelText("Mensagem para o agente"), "x");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Pedido inválido",
    );
  });

  it("surfaces a thrown transport failure", async () => {
    const user = userEvent.setup();
    const sendMessage = vi
      .fn<SendMessage>()
      .mockRejectedValue(new Error("network down"));

    render(<ChatPanel sendMessage={sendMessage} />);

    await user.type(screen.getByLabelText("Mensagem para o agente"), "x");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("network down");
  });

  it("keeps the send button disabled while the composer is empty", () => {
    render(<ChatPanel sendMessage={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Enviar" })).toBeDisabled();
  });

  it("sends a suggestion on click", async () => {
    const user = userEvent.setup();
    const sendMessage = vi
      .fn<SendMessage>()
      .mockResolvedValue(reply("resposta"));

    render(<ChatPanel sendMessage={sendMessage} />);
    await user.click(
      screen.getByRole("button", { name: /Cria uma campanha de leads/ }),
    );

    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));
    expect(sendMessage.mock.calls[0]?.[0].message).toContain("€50/dia");
  });
});
