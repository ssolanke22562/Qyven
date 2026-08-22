import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tracesDir = path.join(process.cwd(), "eval", "traces");
    if (!fs.existsSync(tracesDir)) {
      return NextResponse.json({ traces: [], message: "No traces yet. Run a query to generate traces." });
    }

    const files = fs
      .readdirSync(tracesDir)
      .filter((f) => f.endsWith(".json") && f !== "latest.json")
      .sort()
      .reverse()
      .slice(0, 50); // Return at most 50 recent traces

    const traces = files.map((f) => {
      try {
        const raw = fs.readFileSync(path.join(tracesDir, f), "utf-8");
        const t = JSON.parse(raw);
        return {
          traceId: t.traceId,
          query: t.query,
          status: t.status,
          totalDurationMs: t.totalDurationMs,
          spanCount: t.spanCount,
          errorSpanCount: t.errorSpanCount,
          totalPromptTokens: t.totalPromptTokens,
          totalCompletionTokens: t.totalCompletionTokens,
          estimatedTotalCostUsd: t.estimatedTotalCostUsd,
          startTimeMs: t.startTimeMs,
          demoOptions: t.demoOptions,
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({ traces, count: traces.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to list traces";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
