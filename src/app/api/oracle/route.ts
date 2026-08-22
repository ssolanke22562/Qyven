import { NextRequest, NextResponse } from "next/server";
import { MOCK_NODES } from "@/data/knowledgeGraphData";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const FALLBACK_MODELS = ["qwen/qwen3.6-27b", "groq/compound", "openai/gpt-oss-20b"];

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { query, history = [], isChatMode = false } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Build grounding knowledge graph context summary from MOCK_NODES
    const knowledgeContext = MOCK_NODES.map((n) => (
      `[ID: ${n.id}] [${n.primary_category}] (Severity: ${n.severity}) "${n.title}": ${n.one_line_summary} (Entities: ${n.key_entities.join(", ")}; Linked Nodes: ${n.linked_item_ids.join(", ")})`
    )).join("\n");

    const systemPrompt = `You are AgentX (internal engine: InsightScout), an autonomous research & competitor intelligence AI agent.
You have real-time access to the following dynamic 3D Knowledge Graph:
=== KNOWLEDGE GRAPH NODES ===
${knowledgeContext}
=============================

Your goal is to provide sharp, concise, authoritative, and strategic competitor intelligence responses.
Always ground your answers in the knowledge graph data when relevant, citing specific node IDs like [res-01], [comp-01], [tech-01], [pol-01], etc.

${isChatMode ? `Format your response as a clear, intelligent conversational response. Use bullet points and bold highlights for readability.` : `Format your response in structured JSON with the following keys:
{
  "summary": "2-3 sentence executive intelligence synthesis",
  "threatAssessment": "Threat level (CRITICAL, HIGH, MONITOR, or OPPORTUNITY) with threat index score out of 100 and rationale",
  "recommendedActions": ["Concrete action 1", "Concrete action 2", "Concrete action 3"],
  "linkedNodes": ["comp-01", "tech-01"] // list of node IDs referenced
}`}
`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      { role: "user", content: query },
    ];

    let responseData: any = null;
    let modelUsed = DEFAULT_MODEL;

    // Try primary model, then fallback models
    const modelsToTry = [DEFAULT_MODEL, ...FALLBACK_MODELS];

    for (const model of modelsToTry) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.3,
            max_tokens: 1000,
            ...(isChatMode ? {} : { response_format: { type: "json_object" } }),
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            responseData = content;
            modelUsed = model;
            break;
          }
        }
      } catch (err) {
        console.warn(`Model ${model} failed, trying fallback...`, err);
      }
    }

    const latencyMs = Date.now() - startTime;

    if (!responseData) {
      // Graceful fallback if Groq API is unavailable
      return NextResponse.json({
        success: true,
        isFallback: true,
        modelUsed: "InsightScout Heuristic Engine (Local Fallback)",
        latencyMs,
        response: isChatMode ? `AgentX has analyzed your query: "${query}". Based on the current knowledge graph topology, key competitor activities are concentrated around custom silicon investments [comp-01] and test-time reasoning compute scaling [res-01].` : {
          summary: `AgentX heuristic analysis on: "${query}". Identified strategic convergence between proprietary hardware integration and test-time compute reasoning algorithms.`,
          threatAssessment: "HIGH (Index: 82/100). Competitor moves create margin pressure, requiring immediate vector graph optimization and dynamic quantization adoption.",
          recommendedActions: [
            "Traverse incident nodes in the 3D topology explorer for cross-domain evidence.",
            "Deploy automated patent mining crawlers on target assignees.",
            "Optimize local FP4 inference pipelines to counter cloud pricing shifts."
          ],
          linkedNodes: ["comp-01", "res-01", "tech-01", "mkt-01"]
        }
      });
    }

    if (isChatMode) {
      return NextResponse.json({
        success: true,
        modelUsed,
        latencyMs,
        response: responseData,
      });
    }

    // Parse JSON response
    try {
      const parsed = JSON.parse(responseData);
      return NextResponse.json({
        success: true,
        modelUsed,
        latencyMs,
        response: {
          summary: parsed.summary || responseData,
          threatAssessment: parsed.threatAssessment || "HIGH (Index: 78/100)",
          recommendedActions: parsed.recommendedActions || [
            "Monitor upstream patent filings",
            "Accelerate dynamic reasoning integration"
          ],
          linkedNodes: parsed.linkedNodes || ["comp-01", "tech-02"]
        }
      });
    } catch {
      return NextResponse.json({
        success: true,
        modelUsed,
        latencyMs,
        response: {
          summary: responseData,
          threatAssessment: "HIGH (Index: 75/100)",
          recommendedActions: [
            "Traverse connected 3D graph neighborhood",
            "Track competitive pricing signals"
          ],
          linkedNodes: ["comp-01", "tech-01"]
        }
      });
    }
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({
      error: error.message || "Failed to process Oracle request"
    }, { status: 500 });
  }
}