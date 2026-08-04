import { Bot, User } from "lucide-react";

import { RichText } from "@/components/chat/rich-text";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/agent";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const Icon = isUser ? User : Bot;

  return (
    <article
      data-role={message.role}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full border",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        <Icon className="size-4" />
      </span>

      <div
        className={cn(
          "max-w-[85%] rounded-lg border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
          isUser ? "bg-primary text-primary-foreground" : "bg-card",
        )}
      >
        <span className="sr-only">
          {isUser ? "Mensagem do utilizador" : "Resposta do agente"}:{" "}
        </span>
        <RichText>{message.content}</RichText>
      </div>
    </article>
  );
}
