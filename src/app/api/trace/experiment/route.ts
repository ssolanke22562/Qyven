import { NextResponse } from "next/server";
import { runObservabilityExperiment } from "@/lib/tracing/experimentRunner";
import { redactSensitiveData } from "@/lib/tracing/redactor";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { query, scenario = "news_503", iterations = 1 } = body;

    const experimentResult = await runObservabilityExperiment({
      query,
      scenario,
      iterations: Math.min(10, Math.max(1, iterations)),
    });

    const sanitized = redactSensitiveData(experimentResult);

    return NextResponse.json({
      success: true,
      experiment: sanitized,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Experiment execution failed";
    console.error("[API /api/trace/experiment] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
