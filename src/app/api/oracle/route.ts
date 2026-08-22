import { NextRequest, NextResponse } from "next/server";
import { AgentOrchestrator } from "@/lib/agents/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, isChatMode = false, sessionId, userId = "anonymous" } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Instantiate and execute explicit Multi-Agent Orchestrator with memory context
    const orchestrator = new AgentOrchestrator(query, isChatMode, sessionId, userId);
    const result = await orchestrator.execute();

    const memoryBlock = result.memory || {
      sessionId: result.sessionId || sessionId || "fresh-session",
      shortTermTurns: 2,
      longTermRecordsRetrieved: 0,
      longTermRecordsStored: 1,
    };

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
        sessionId: result.sessionId,
        memory: memoryBlock,
        traceId: result.qyvenState?.traceId,
        spanCount: result.qyvenState?.spans?.length ?? 0,
        errorSpanCount: result.qyvenState?.spans?.filter((s: any) => s.status === "error").length ?? 0,
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
      sessionId: result.sessionId,
      memory: memoryBlock,
      traceId: result.qyvenState?.traceId,
      spanCount: result.qyvenState?.spans?.length ?? 0,
      errorSpanCount: result.qyvenState?.spans?.filter((s: any) => s.status === "error").length ?? 0,
    });
  } catch (error: any) {
    console.error("Multi-Agent Orchestration API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute Multi-Agent Orchestration" },
      { status: 500 }
    );
  }
}