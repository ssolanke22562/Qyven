import { NextRequest, NextResponse } from "next/server";
import { createInitialQyvenState, DemoOptions } from "@/lib/agents/qyvenState";
import { qyvenEngine } from "@/lib/agents/stateGraph";
import { investigationMemory } from "@/lib/agents/investigationMemory";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, demoOptions, sessionId = `sess-${Date.now()}` } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query string is required" }, { status: 400 });
    }

    const initialDemoOpts: DemoOptions = demoOptions || {
      enableAdversarialMode: false,
    };

    const initialState = createInitialQyvenState(query.trim(), sessionId, initialDemoOpts);
    const finalState = await qyvenEngine.runGraph(initialState);

    const memoryHistory = investigationMemory.getAllInvestigations();

    return NextResponse.json({
      success: true,
      investigationId: finalState.investigationId,
      status: finalState.status,
      confidenceScore: finalState.confidence.score,
      confidence: finalState.confidence,
      evidenceTable: finalState.evidenceTable,
      conflicts: finalState.conflicts,
      plan: finalState.currentPlan,
      executionHistory: finalState.executionHistory,
      checkpoints: finalState.checkpoints,
      budget: finalState.budget,
      selfEvaluation: finalState.selfEvaluation,
      response: finalState.finalReport,
      formattedMarkdown: finalState.finalReport?.formattedMarkdown,
      isFallback: finalState.isFallback,
      memoryHistory,
      qyvenState: finalState,
    });
  } catch (error: any) {
    console.error("Agentic Graph Execution API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute Qyven agentic graph" },
      { status: 500 }
    );
  }
}
