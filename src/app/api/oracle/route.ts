import { NextRequest, NextResponse } from "next/server";
import { AgentOrchestrator } from "@/lib/agents/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, isChatMode = false } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Instantiate and execute explicit Multi-Agent Orchestrator
    const orchestrator = new AgentOrchestrator(query, isChatMode);
    const result = await orchestrator.execute();

    if (isChatMode) {
      return NextResponse.json({
        success: result.success,
        modelUsed: result.modelUsed,
        latencyMs: result.latencyMs,
        toolsUsed: result.toolsUsed,
        sources: result.sources,
        logs: result.logs,
        agentStates: result.agentStates,
        communicationPayload: result.communicationPayload,
        response: result.formattedMarkdownResponse || result.response.summary,
        isFallback: result.isFallback,
      });
    }

    return NextResponse.json({
      success: result.success,
      modelUsed: result.modelUsed,
      latencyMs: result.latencyMs,
      toolsUsed: result.toolsUsed,
      sources: result.sources,
      logs: result.logs,
      agentStates: result.agentStates,
      communicationPayload: result.communicationPayload,
      response: result.response,
      isFallback: result.isFallback,
    });
  } catch (error: any) {
    console.error("Multi-Agent Orchestration API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute Multi-Agent Orchestration" },
      { status: 500 }
    );
  }
}