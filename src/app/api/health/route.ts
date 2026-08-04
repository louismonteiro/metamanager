import { NextResponse } from "next/server";

import { buildHealthReport } from "@/lib/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness plus the state of the Meta Marketing API connection. */
export async function GET(): Promise<NextResponse> {
  const report = await buildHealthReport();

  // `degraded` still means the process is alive — only a failed Meta call is 503.
  const status = report.status === "error" ? 503 : 200;

  return NextResponse.json(report, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
