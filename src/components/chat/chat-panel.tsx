"use client";

import * as React from "react";
import { CornerDownLeft, Loader2 } from "lucide-react";

import { MessageBubble } from "@/components/chat/message-bubble";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage } from "@/lib/agent";
import type { SendMessageResult } from "@/app/chat/actions";

/** Straight from the roadmap's list of requests the product must serve. */
export const SUGGESTIONS = [
  "Cria uma campanha de leads com €50/dia para Lisboa e Porto, mulheres 25-45.",
  "Duplica a campanha Black Friday com orçamento de €80/dia e tudo pausado.",
  "Quais anúncios têm CPC acima de €2? Pausa-os.",
  "Exporta os leads do formulário de contacto dos últimos 30 dias.",
] as const;

export type SendMessage = (input: {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}) => Promise<SendMessageResult>;

export interface ChatPanelProps {
  /** Injected so the panel can be driven without a server in tests. */
  sendMessage: SendMessage;
}

function newId(): string {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function ChatPanel({ sendMessage }: ChatPanelProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isSending]);

  const submit = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      const userMessage: ChatMessage = {
        id: newId(),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const history = messages.map(({ role, content }) => ({ role, content }));

      setMessages((current) => [...current, userMessage]);
      setDraft("");
      setError(null);
      setIsSending(true);

      try {
        const result = await sendMessage({ message: trimmed, history });
        if (result.ok) {
          setMessages((current) => [...current, result.reply.message]);
        } else {
          setError(result.error);
        }
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível falar com o agente.",
        );
      } finally {
        setIsSending(false);
      }
    },
    [isSending, messages, sendMessage],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit(draft);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col gap-4">
      <div
        role="log"
        aria-live="polite"
        aria-label="Histórico da conversa"
        className="flex-1 space-y-4 overflow-y-auto rounded-lg border p-4"
      >
        {messages.length === 0 && !isSending ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-muted-foreground max-w-md text-sm">
              Pede em linguagem natural. O agente responde com a intenção que
              leu e o plano de chamadas à Meta Marketing API — e nada é
              executado sem a tua confirmação.
            </p>
            <ul className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <li key={suggestion}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto max-w-xs py-1.5 text-left text-xs whitespace-normal"
                    onClick={() => void submit(suggestion)}
                  >
                    {suggestion}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {isSending ? (
          <p
            data-testid="chat-loading"
            className="text-muted-foreground flex items-center gap-2 text-sm"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden />O agente está
            a analisar o pedido…
          </p>
        ) : null}

        <div ref={bottomRef} />
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(draft);
        }}
      >
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          rows={3}
          aria-label="Mensagem para o agente"
          placeholder="Ex.: cria uma campanha de leads com €50/dia para Lisboa e Porto…"
        />
        <div className="flex items-center justify-between gap-3">
          <Badge variant="outline" className="font-normal">
            Motor de raciocínio ainda não ligado — respostas são planos, não
            execuções
          </Badge>
          <Button type="submit" size="sm" disabled={isSending || !draft.trim()}>
            {isSending ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <CornerDownLeft aria-hidden />
            )}
            Enviar
          </Button>
        </div>
      </form>
    </div>
  );
}
