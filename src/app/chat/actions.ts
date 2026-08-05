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
 * Reads run for real: a listing request is answered with the account's
 * campaigns, read server-side so the Meta token never reaches the browser.
 * Writes are still only planned, and nothing writes without a confirmation.
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

  return { ok: true, reply: await respondToMessage(parsed.data.message) };
}
