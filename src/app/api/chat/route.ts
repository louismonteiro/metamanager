import { NextResponse } from "next/server";

import { chatRequestSchema, respondToMessage } from "@/lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Programmatic twin of the `sendMessage` server action.
 *
 * The chat UI uses the action; this route exists so the same agent contract is
 * reachable from outside the React tree — scripts, integration tests, and the
 * tool layer that will drive it once the LLM brain lands.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Corpo do pedido não é JSON válido" },
      { status: 400 },
    );
  }

  const parsed = chatRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Pedido inválido",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    reply: respondToMessage(parsed.data.message),
  });
}
