/**
 * eval/test-tracing.ts
 *
 * Automated verification test suite for Qyven Tracing & Observability.
 * Validates:
 *   1. Hierarchical span generation and parent-child linking
 *   2. Automatic secret and credential redaction
 *   3. Token accounting and cost estimation
 *   4. Controlled failure injection and propagation
 *   5. Automated root-cause diagnosis
 *   6. Safe runtime policy generation and re-run execution
 *   7. Graceful external telemetry degradation
 */

import { loadEnvFiles } from "./loadEnv";
loadEnvFiles();

import { createInitialQyvenState, DemoOptions } from "@/lib/agents/qyvenState";
import { qyvenEngine } from "@/lib/agents/stateGraph";
import { redactSensitiveData } from "@/lib/tracing/redactor";
import { diagnoseTrace, generateRepairedPolicy } from "@/lib/tracing/diagnose";
import { runObservabilityExperiment } from "@/lib/tracing/experimentRunner";
import { estimateTokensFromText, estimateTokenCost } from "@/lib/tracing/tracer";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` (${detail})` : ""}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("  QYVEN OBSERVABILITY & TRACING TEST SUITE");
  console.log("=======================================================\n");

  // TEST 1: Secret Redaction
  console.log("[Test 1] Secret & Credential Redaction");
  const dirtyPayload = {
    apiKey: "pub_1234567890abcdef1234567890",
    groqKey: "gsk_1234567890abcdef1234567890",
    geminiKey: "AIzaSyD1234567890abcdef1234567890abcdef",
    authHeader: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    userPrompt: "Investigate Apple using key pub_999999999999999999 for query",
  };
  const cleanPayload = redactSensitiveData(dirtyPayload);
  assert(!JSON.stringify(cleanPayload).includes("pub_1234567890"), "Redacts NewsData pub_ keys");
  assert(!JSON.stringify(cleanPayload).includes("gsk_1234567890"), "Redacts Groq gsk_ keys");
  assert(!JSON.stringify(cleanPayload).includes("AIzaSyD12345"), "Redacts Google AIza keys");
  assert(!JSON.stringify(cleanPayload).includes("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"), "Redacts Bearer JWT tokens");

  // TEST 2: Token Estimation & Pricing
  console.log("\n[Test 2] Token Estimation & Cost Accounting");
  const sampleText = "Autonomous competitor intelligence agent with Graph RAG vector synthesis.";
  const estimatedTokens = estimateTokensFromText(sampleText);
  assert(estimatedTokens > 5 && estimatedTokens < 30, "Estimates realistic token count for text");
  const cost = estimateTokenCost("groq/compound", 1000, 500);
  assert(cost > 0 && cost < 0.01, "Computes valid token pricing in USD");

  // TEST 3: Trace Hierarchy & Execution
  console.log("\n[Test 3] End-to-End Tracing Execution");
  const state = createInitialQyvenState("Analyze competitor silicon fab acquisition", "test-session-1");
  const finalState = await qyvenEngine.runGraph(state);
  assert(finalState.spans.length >= 4, "Records spans for pipeline execution", `Span count: ${finalState.spans.length}`);
  const rootSpan = finalState.spans.find((s) => s.name === "pipeline.run");
  assert(Boolean(rootSpan), "Creates root pipeline.run span");
  const childSpans = finalState.spans.filter((s) => s.parentSpanId === rootSpan?.spanId);
  assert(childSpans.length >= 2, "Links child spans hierarchically to root span");

  // TEST 4: Controlled Failure & Root Cause Diagnosis
  console.log("\n[Test 4] Controlled Failure Injection & Diagnosis");
  const failOptions: DemoOptions = {
    enableAdversarialMode: false,
    scenario: "news_503",
    forceNewsFailure: true,
  };
  const failState = createInitialQyvenState("Analyze TSMC 2nm AI chip allocation", "test-session-fail", failOptions);
  const failResult = await qyvenEngine.runGraph(failState);

  const errorSpans = failResult.spans.filter((s) => s.status === "error");
  assert(errorSpans.length > 0, "Captures error span for controlled failure");

  const traceFile = {
    traceId: failResult.traceId,
    runId: failResult.runId,
    investigationId: failResult.investigationId,
    sessionId: failResult.sessionId,
    query: failResult.userQuery,
    status: failResult.status,
    startTimeMs: failResult.startTimeMs,
    endTimeMs: Date.now(),
    totalDurationMs: 500,
    spanCount: failResult.spans.length,
    errorSpanCount: errorSpans.length,
    totalPromptTokens: 100,
    totalCompletionTokens: 100,
    totalTokens: 200,
    estimatedTotalCostUsd: 0.001,
    agentBreakdown: [],
    spans: failResult.spans,
    demoOptions: failResult.demoOptions as any,
  };

  const diagnosis = diagnoseTrace(traceFile);
  assert(diagnosis.severityLevel === "HIGH", "Assigns HIGH severity to News 503 failure");
  assert(diagnosis.failedComponent === "NEWS_AGENT", "Identifies NEWS_AGENT as failed component");
  assert(Boolean(diagnosis.repairPlan), "Generates actionable RepairPlan");

  // TEST 5: Safe Runtime Policy Self-Repair
  console.log("\n[Test 5] Safe Runtime Policy Mutation");
  const repairedPolicy = generateRepairedPolicy(diagnosis);
  assert(repairedPolicy.toolRouting.bypassUnavailableTools.includes("NEWS_AGENT"), "Adds failed tool to bypass list in repaired policy");
  assert(repairedPolicy.toolRouting.enableNewsFallbackKB === true, "Activates KB fallback in repaired policy");

  // TEST 6: Automated Experiment Runner
  console.log("\n[Test 6] Full Automated Observability Experiment Loop");
  const experiment = await runObservabilityExperiment({
    query: "Analyze competitor AI accelerator wafer allocation",
    scenario: "news_503",
    iterations: 1,
  });
  assert(Boolean(experiment.baselineRun), "Executes baseline run with failure");
  assert(Boolean(experiment.diagnosis), "Diagnoses baseline failure");
  assert(Boolean(experiment.improvedRun), "Executes improved run with repaired policy");
  assert(Boolean(experiment.comparison), "Calculates before vs after comparison metrics");

  console.log("\n=======================================================");
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
