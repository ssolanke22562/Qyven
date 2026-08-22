import { NextResponse } from "next/server";
import { runObservabilityExperiment } from "@/lib/tracing/experimentRunner";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { scenario = "news_503", iterations = 5, query } = body;

    const experiment = await runObservabilityExperiment({
      query,
      scenario,
      iterations: Math.min(10, Math.max(1, iterations)),
    });

    return NextResponse.json({
      success: true,
      comparison: experiment.comparison,
      experimentId: experiment.experimentId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Benchmark suite execution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
