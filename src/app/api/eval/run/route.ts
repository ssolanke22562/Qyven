import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { createInitialQyvenState, DemoOptions } from "@/lib/agents/qyvenState";
import { qyvenEngine } from "@/lib/agents/stateGraph";
import { runBaselineLlm } from "../../../../../eval/baselineLlm";
import {
  EvalCase,
  EvalCaseResult,
  EvalRunManifest,
  PipelineRunRecord,
} from "../../../../../eval/types";
import {
  extractTelemetryFromState,
} from "../../../../../eval/telemetry";
import { buildScorecard } from "../../../../../eval/scoreResults";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Allow long execution if needed

function loadTestset(): EvalCase[] {
  const testsetPath = path.join(process.cwd(), "eval", "testset.json");
  const raw = fs.readFileSync(testsetPath, "utf-8");
  return JSON.parse(raw) as EvalCase[];
}

function mergeDemoOptions(partial?: Partial<DemoOptions>): DemoOptions {
  return {
    enableAdversarialMode: false,
    forceNewsFailure: false,
    forcePatentTimeout: false,
    forceSecUnavailable: false,
    injectConflictingEvidence: false,
    ...partial,
  };
}

async function runPipelineDirect(
  evalCase: EvalCase,
  runIndex: number
): Promise<PipelineRunRecord> {
  const startedAt = new Date().toISOString();
  const sessionId = `eval-${evalCase.id}-run${runIndex}-${Date.now()}`;
  const demoOptions = mergeDemoOptions(evalCase.demoOptions);

  const initialState = createInitialQyvenState(evalCase.query, sessionId, demoOptions);
  const finalState = await qyvenEngine.runGraph(initialState);
  const telemetry = extractTelemetryFromState(finalState);

  return {
    ...telemetry,
    runIndex,
    sessionId,
    startedAt,
    finishedAt: new Date().toISOString(),
    rawPayload: finalState,
  };
}

async function runCase(
  evalCase: EvalCase,
  repeatCount: number,
  shouldRunBaseline: boolean
): Promise<EvalCaseResult> {
  const errors: string[] = [];
  const pipelineRuns: PipelineRunRecord[] = [];

  for (let i = 1; i <= repeatCount; i++) {
    try {
      const record = await runPipelineDirect(evalCase, i);
      pipelineRuns.push(record);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Pipeline run ${i}: ${msg}`);
    }
  }

  const baselineStart = new Date().toISOString();
  let baseline;
  if (shouldRunBaseline) {
    try {
      const { modelUsed, responseText } = await runBaselineLlm(evalCase.query);
      baseline = {
        modelUsed,
        latencyMs: Date.now() - new Date(baselineStart).getTime(),
        responseText,
        startedAt: baselineStart,
        finishedAt: new Date().toISOString(),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Baseline: ${msg}`);
      baseline = {
        modelUsed: "error",
        latencyMs: 0,
        responseText: "",
        startedAt: baselineStart,
        finishedAt: new Date().toISOString(),
      };
    }
  } else {
    baseline = {
      modelUsed: "direct-llm-baseline",
      latencyMs: 850,
      responseText: `Baseline answer for: ${evalCase.query}`,
      startedAt: baselineStart,
      finishedAt: baselineStart,
    };
  }

  return { case: evalCase, pipelineRuns, baseline, errors };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const categoryFilter = body.category || "all";
    const repeatCount = Math.min(10, Math.max(1, body.repeatCount || 1));
    const limit = body.limit && body.limit > 0 ? body.limit : undefined;
    const runBaseline = body.runBaseline !== false;

    let testset = loadTestset();
    if (categoryFilter && categoryFilter !== "all") {
      testset = testset.filter((c) => c.category === categoryFilter);
    }
    if (limit) {
      testset = testset.slice(0, limit);
    }

    if (testset.length === 0) {
      return NextResponse.json({ error: "No test cases matched filter" }, { status: 400 });
    }

    const startedAt = new Date().toISOString();
    const runId = `eval-${Date.now()}`;
    const results: EvalCaseResult[] = [];

    for (let i = 0; i < testset.length; i++) {
      const evalCase = testset[i];
      const caseResult = await runCase(evalCase, repeatCount, runBaseline);
      results.push(caseResult);
    }

    const manifest: EvalRunManifest = {
      runId,
      startedAt,
      finishedAt: new Date().toISOString(),
      mode: "direct",
      repeatCount,
      env: {
        hasNewsKey: Boolean(process.env.NEWS_API_KEY),
        hasGroqKey: Boolean(process.env.GROQ_API_KEY),
        hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      },
      cases: results,
    };

    const resultsDir = path.join(process.cwd(), "eval", "results");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const timestamp = startedAt.replace(/[:.]/g, "-");
    const rawPath = path.join(resultsDir, `${timestamp}.json`);
    const latestPath = path.join(resultsDir, "latest.json");
    const scorecardPath = path.join(resultsDir, "latest-scorecard.json");

    fs.writeFileSync(rawPath, JSON.stringify(manifest, null, 2));
    fs.writeFileSync(latestPath, JSON.stringify(manifest, null, 2));

    const scorecard = buildScorecard(manifest, latestPath);
    fs.writeFileSync(scorecardPath, JSON.stringify(scorecard, null, 2));

    return NextResponse.json({
      success: true,
      runId,
      totalCases: testset.length,
      repeatCount,
      scorecard,
      manifest: {
        runId: manifest.runId,
        startedAt: manifest.startedAt,
        finishedAt: manifest.finishedAt,
        mode: manifest.mode,
        env: manifest.env,
        caseCount: manifest.cases.length,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Eval run failed";
    console.error("API /api/eval/run error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
