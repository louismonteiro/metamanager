"use server";

import {
  chatRequestSchema,
  respondToMessage,
  type AgentReply,
} from "@/lib/agent";

export type SendMessageResult =
  { ok: true; reply: AgentReply } | { ok: false; error: string };

/**
 * Server action the chat composer calls.
 *
 * The agent brain is a placeholder for this slice: it parses the request into a
 * structured intent and answers with the plan of Meta API calls it would run.
 * Nothing is executed against the Graph API.
 */
export async function sendMessage(input: {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<SendMessageResult> {
  const parsed = chatRequestSchema.safeParse(input);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Pedido inválido" };
  }

  return { ok: true, reply: respondToMessage(parsed.data.message) };
}
