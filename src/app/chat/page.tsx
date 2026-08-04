import type { Metadata } from "next";

import { ChatPanel } from "@/components/chat/chat-panel";
import { sendMessage } from "./actions";

export const metadata: Metadata = {
  title: "Chat",
  description:
    "Superfície de ação do MetaManager: pede em linguagem natural e o agente devolve o plano de chamadas à Meta Marketing API.",
};

export default function ChatPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Chat com o agente
        </h1>
        <p className="text-muted-foreground text-sm">
          A única superfície de ação do produto. Escreve o que queres fazer; o
          agente restata o pedido de forma estruturada e propõe o plano.
        </p>
      </div>

      <ChatPanel sendMessage={sendMessage} />
    </div>
  );
}
