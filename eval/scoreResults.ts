#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import {
  CategoryMetrics,
  EvalCategory,
  EvalRunManifest,
  MetricValue,
  Scorecard,
} from "./types";
import {
  collectEvidenceTexts,
  factMatchScore,
  groundednessScore,
} from "./utils/textMatch";
import { averageMetric, jaccardSimilarity, mean, percentile, stddev } from "./utils/stats";
import {
  hasRecoveryEvidence,
  hasValidSynthesis,
  indicatesLowEvidence,
} from "./telemetry";

const CATEGORIES: EvalCategory[] = [
  "normal",
  "ambiguous",
  "adversarial",
  "contradictory",
  "incomplete",
  "tool_failure",
];

function parseArgs() {
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf("--input");
  const outIdx = args.indexOf("--out");
  return {
    inputFile: inputIdx >= 0 ? args[inputIdx + 1] : undefined,
    outFile: outIdx >= 0 ? args[outIdx + 1] : undefined,
  };
}

function resolveInputFile(explicit?: string): string {
  if (explicit) return path.resolve(explicit);
  const latest = path.join(process.cwd(), "eval", "results", "latest.json");
  if (fs.existsSync(latest)) return latest;
  const resultsDir = path.join(process.cwd(), "eval", "results");
  const files = fs
    .readdirSync(resultsDir)
    .filter((f) => f.endsWith(".json") && f !== "latest.json")
    .sort()
    .reverse();
  if (files.length === 0) throw new Error("No results found in eval/results/. Run npm run eval first.");
  return path.join(resultsDir, files[0]);
}

function fmtMetric(v: MetricValue): string {
  if (v === "unscored") return "unscored";
  if (typeof v === "number") {
    if (v <= 1) return `${(v * 100).toFixed(1)}%`;
    return `${v.toFixed(0)}ms`;
  }
  return String(v);
}

function fmtRatio(v: MetricValue): string {
  if (v === "unscored") return "unscored";
  return `${(v * 100).toFixed(1)}%`;
}

function scoreCaseAccuracy(
  responseText: string,
  facts: string[]
): MetricValue {
  return factMatchScore(responseText, facts);
}

function scoreCaseGroundedness(
  responseText: string,
  rawPayload: unknown
): MetricValue {
  const payload = rawPayload as Record<string, unknown>;
  const state = (payload.qyvenState || payload) as Record<string, unknown>;
  const evidenceTexts = collectEvidenceTexts({
    evidenceTable: state.evidenceTable as Array<{ claim?: string }>,
    sources: state.sources as Array<{ title?: string; summary?: string }>,
    response: state.finalReport as { summary?: string; recentNews?: string[] },
  });
  return groundednessScore(responseText, evidenceTexts);
}

function computeCategoryMetrics(
  manifest: EvalRunManifest,
  category: EvalCategory
): CategoryMetrics {
  const cases = manifest.cases.filter((c) => c.case.category === category);

  const accuracyScores: Array<number | "unscored"> = [];
  const groundednessScores: Array<number | "unscored"> = [];
  const consistencyScores: number[] = [];
  const recoveryScores: boolean[] = [];
  const uncertaintyScores: boolean[] = [];
  const latencies: number[] = [];
  const baselineAccuracies: number[] = [];
  const baselineGroundedness: number[] = [];
  const agentAccuracies: number[] = [];
  const agentGroundedness: number[] = [];

  for (const caseResult of cases) {
    const facts = caseResult.case.ground_truth_facts;
    const runs = caseResult.pipelineRuns;

    const runAccuracies = runs.map((r) => scoreCaseAccuracy(r.responseText, facts));
    const runGroundedness = runs.map((r) => scoreCaseGroundedness(r.responseText, r.rawPayload));

    const numericAcc = runAccuracies.filter((v): v is number => typeof v === "number");
    if (numericAcc.length > 0) {
      accuracyScores.push(mean(numericAcc));
      agentAccuracies.push(mean(numericAcc));
    } else {
      accuracyScores.push("unscored");
    }

    const numericGround = runGroundedness.filter((v): v is number => typeof v === "number");
    if (numericGround.length > 0) {
      groundednessScores.push(mean(numericGround));
      agentGroundedness.push(mean(numericGround));
    } else {
      groundednessScores.push("unscored");
    }

    if (runs.length >= 2) {
      const confidences = runs.map((r) => r.confidenceScore);
      const confStd = stddev(confidences);
      const findingSets = runs.map((r) => r.keyFindings);
      let findingSim = 1;
      for (let i = 0; i < findingSets.length - 1; i++) {
        findingSim = Math.min(findingSim, jaccardSimilarity(findingSets[i], findingSets[i + 1]));
      }
      const consistency = Math.max(0, 1 - confStd / 50) * 0.5 + findingSim * 0.5;
      consistencyScores.push(consistency);
    }

    runs.forEach((r) => latencies.push(r.latencyMs));

    if (category === "adversarial" || category === "tool_failure") {
      const recovered = runs.some(
        (r) => hasValidSynthesis(r) && hasRecoveryEvidence(r)
      );
      recoveryScores.push(recovered);
    }

    if (category === "ambiguous" || category === "incomplete") {
      const handled = runs.some((r) => indicatesLowEvidence(r));
      uncertaintyScores.push(handled);
    }

    const baseAcc = scoreCaseAccuracy(caseResult.baseline.responseText, facts);
    if (typeof baseAcc === "number") baselineAccuracies.push(baseAcc);
    const baseGround = groundednessScore(caseResult.baseline.responseText, []);
    if (typeof baseGround === "number") baselineGroundedness.push(baseGround);
  }

  const accuracy = averageMetric(accuracyScores);
  const groundedness = averageMetric(groundednessScores);
  const hallucinationRate: MetricValue =
    groundedness === "unscored" ? "unscored" : 1 - groundedness;
  const consistency: MetricValue =
    consistencyScores.length > 0 ? mean(consistencyScores) : "unscored";
  const recoveryRate: MetricValue =
    recoveryScores.length > 0 ? mean(recoveryScores.map((b) => (b ? 1 : 0))) : "unscored";
  const uncertaintyHandling: MetricValue =
    uncertaintyScores.length > 0 ? mean(uncertaintyScores.map((b) => (b ? 1 : 0))) : "unscored";

  const baselineAccuracyDelta: MetricValue =
    accuracy !== "unscored" && baselineAccuracies.length > 0
      ? accuracy - mean(baselineAccuracies)
      : "unscored";
  const baselineGroundednessDelta: MetricValue =
    groundedness !== "unscored" && agentGroundedness.length > 0
      ? groundedness - (baselineGroundedness.length > 0 ? mean(baselineGroundedness) : 0)
      : groundedness !== "unscored"
        ? groundedness
        : "unscored";

  return {
    category,
    caseCount: cases.length,
    accuracy,
    groundedness,
    hallucinationRate,
    consistency,
    recoveryRate,
    uncertaintyHandling,
    latencyMeanMs: latencies.length > 0 ? mean(latencies) : "unscored",
    latencyP95Ms: latencies.length > 0 ? percentile(latencies, 95) : "unscored",
    baselineAccuracyDelta,
    baselineGroundednessDelta,
  };
}

function buildScorecard(manifest: EvalRunManifest, sourceFile: string): Scorecard {
  const byCategory = CATEGORIES.map((cat) => computeCategoryMetrics(manifest, cat));

  const overall: CategoryMetrics = {
    category: "overall" as EvalCategory,
    caseCount: manifest.cases.length,
    accuracy: averageMetric(byCategory.map((c) => c.accuracy)),
    groundedness: averageMetric(byCategory.map((c) => c.groundedness)),
    hallucinationRate: averageMetric(
      byCategory
        .map((c) => c.hallucinationRate)
        .filter((v): v is number => typeof v === "number")
    ),
    consistency: averageMetric(byCategory.map((c) => c.consistency)),
    recoveryRate: averageMetric(
      byCategory
        .filter((c) => c.category === "adversarial" || c.category === "tool_failure")
        .map((c) => c.recoveryRate)
    ),
    uncertaintyHandling: averageMetric(
      byCategory
        .filter((c) => c.category === "ambiguous" || c.category === "incomplete")
        .map((c) => c.uncertaintyHandling)
    ),
    latencyMeanMs: averageMetric(
      byCategory.map((c) => c.latencyMeanMs).filter((v): v is number => typeof v === "number")
    ),
    latencyP95Ms: averageMetric(
      byCategory.map((c) => c.latencyP95Ms).filter((v): v is number => typeof v === "number")
    ),
    baselineAccuracyDelta: averageMetric(byCategory.map((c) => c.baselineAccuracyDelta)),
    baselineGroundednessDelta: averageMetric(byCategory.map((c) => c.baselineGroundednessDelta)),
  };

  const perCase = manifest.cases.map((caseResult) => {
    const runs = caseResult.pipelineRuns;
    const facts = caseResult.case.ground_truth_facts;
    const accs = runs.map((r) => scoreCaseAccuracy(r.responseText, facts));
    const grounds = runs.map((r) => scoreCaseGroundedness(r.responseText, r.rawPayload));
    const numericAcc = accs.filter((v): v is number => typeof v === "number");
    const numericGround = grounds.filter((v): v is number => typeof v === "number");

    const confidences = runs.map((r) => r.confidenceScore);
    const consistency =
      runs.length >= 2
        ? Math.max(0, 1 - stddev(confidences) / 50)
        : ("unscored" as MetricValue);

    const cat = caseResult.case.category;
    let recovery: boolean | "unscored" = "unscored";
    if (cat === "adversarial" || cat === "tool_failure") {
      recovery = runs.some((r) => hasValidSynthesis(r) && hasRecoveryEvidence(r));
    }

    let uncertaintyHandled: boolean | "unscored" = "unscored";
    if (cat === "ambiguous" || cat === "incomplete") {
      uncertaintyHandled = runs.some((r) => indicatesLowEvidence(r));
    }

    const baseAcc = scoreCaseAccuracy(caseResult.baseline.responseText, facts);
    const agentAcc = numericAcc.length > 0 ? mean(numericAcc) : "unscored";
    const baselineAccuracyDelta: MetricValue =
      agentAcc !== "unscored" && typeof baseAcc === "number" ? agentAcc - baseAcc : "unscored";

    const accuracy: MetricValue = numericAcc.length > 0 ? mean(numericAcc) : "unscored";
    const groundedness: MetricValue = numericGround.length > 0 ? mean(numericGround) : "unscored";

    return {
      id: caseResult.case.id,
      category: cat,
      accuracy,
      groundedness,
      consistency,
      recovery,
      uncertaintyHandled,
      latencyMeanMs: runs.length > 0 ? mean(runs.map((r) => r.latencyMs)) : 0,
      baselineAccuracyDelta,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    sourceResultsFile: sourceFile,
    runMetadata: {
      runId: manifest.runId,
      mode: manifest.mode,
      startedAt: manifest.startedAt,
      finishedAt: manifest.finishedAt,
      totalCases: manifest.cases.length,
    },
    overall: { ...overall, category: "overall" },
    byCategory,
    perCase,
  };
}

function renderMarkdown(scorecard: Scorecard): string {
  const lines: string[] = [
    "# Qyven Evaluation Scorecard",
    "",
    `Generated: ${scorecard.generatedAt}`,
    `Source: \`${scorecard.sourceResultsFile}\``,
    "",
    "## Run Metadata",
    "",
    `| Field | Value |`,
    `|-------|-------|`,
    `| Run ID | ${scorecard.runMetadata.runId} |`,
    `| Mode | ${scorecard.runMetadata.mode} |`,
    `| Started | ${scorecard.runMetadata.startedAt} |`,
    `| Finished | ${scorecard.runMetadata.finishedAt} |`,
    `| Total Cases | ${scorecard.runMetadata.totalCases} |`,
    "",
    "## Metrics by Category",
    "",
    "| Category | Cases | Accuracy | Groundedness | Hallucination | Consistency | Recovery | Uncertainty | Latency (mean) | Latency (p95) | Δ Accuracy vs Baseline | Δ Groundedness vs Baseline |",
    "|----------|-------|----------|--------------|---------------|-------------|----------|-------------|----------------|---------------|------------------------|----------------------------|",
  ];

  for (const row of scorecard.byCategory) {
    lines.push(
      `| ${row.category} | ${row.caseCount} | ${fmtRatio(row.accuracy)} | ${fmtRatio(row.groundedness)} | ${fmtRatio(row.hallucinationRate)} | ${fmtRatio(row.consistency)} | ${fmtRatio(row.recoveryRate)} | ${fmtRatio(row.uncertaintyHandling)} | ${fmtMetric(row.latencyMeanMs)} | ${fmtMetric(row.latencyP95Ms)} | ${fmtRatio(row.baselineAccuracyDelta)} | ${fmtRatio(row.baselineGroundednessDelta)} |`
    );
  }

  const o = scorecard.overall;
  lines.push(
    `| **overall** | ${o.caseCount} | **${fmtRatio(o.accuracy)}** | **${fmtRatio(o.groundedness)}** | **${fmtRatio(o.hallucinationRate)}** | **${fmtRatio(o.consistency)}** | **${fmtRatio(o.recoveryRate)}** | **${fmtRatio(o.uncertaintyHandling)}** | **${fmtMetric(o.latencyMeanMs)}** | **${fmtMetric(o.latencyP95Ms)}** | **${fmtRatio(o.baselineAccuracyDelta)}** | **${fmtRatio(o.baselineGroundednessDelta)}** |`
  );

  lines.push(
    "",
    "## Per-Case Summary",
    "",
    "| ID | Category | Accuracy | Groundedness | Consistency | Recovery | Uncertainty | Latency | Δ vs Baseline |",
    "|----|----------|----------|--------------|-------------|----------|-------------|---------|---------------|"
  );

  for (const row of scorecard.perCase) {
    lines.push(
      `| ${row.id} | ${row.category} | ${fmtRatio(row.accuracy)} | ${fmtRatio(row.groundedness)} | ${fmtRatio(row.consistency)} | ${row.recovery === "unscored" ? "unscored" : row.recovery ? "yes" : "no"} | ${row.uncertaintyHandled === "unscored" ? "unscored" : row.uncertaintyHandled ? "yes" : "no"} | ${row.latencyMeanMs.toFixed(0)}ms | ${fmtRatio(row.baselineAccuracyDelta)} |`
    );
  }

  lines.push(
    "",
    "## Notes",
    "",
    "- **unscored** = metric cannot be computed (e.g. empty ground_truth_facts, no evidence in payload).",
    "- Recovery applies to `adversarial` and `tool_failure` categories only.",
    "- Uncertainty handling applies to `ambiguous` and `incomplete` categories only.",
    "- Baseline = single direct LLM call with no agent pipeline or tools.",
    ""
  );

  return lines.join("\n");
}

function main() {
  const { inputFile, outFile } = parseArgs();
  const sourceFile = resolveInputFile(inputFile);
  const manifest: EvalRunManifest = JSON.parse(fs.readFileSync(sourceFile, "utf-8"));

  const scorecard = buildScorecard(manifest, sourceFile);
  const markdown = renderMarkdown(scorecard);

  const mdPath = outFile || path.join(process.cwd(), "eval", "scorecard.md");
  fs.writeFileSync(mdPath, markdown);

  const jsonPath = path.join(process.cwd(), "eval", "results", "latest-scorecard.json");
  fs.writeFileSync(jsonPath, JSON.stringify(scorecard, null, 2));

  console.log(`Scorecard written to ${mdPath}`);
  console.log(`JSON scorecard: ${jsonPath}`);
}

main();
