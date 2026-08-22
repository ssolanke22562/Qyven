import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { HumanEvalRecord } from "../../../../../eval/types";
import { loadHumanEvaluations } from "../../../../../eval/scoreResults";

export const dynamic = "force-dynamic";

function getHumanEvalsPath(): string {
  const dir = path.join(process.cwd(), "eval", "results");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, "human-evals.json");
}

function readHumanEvals(): HumanEvalRecord[] {
  const filePath = getHumanEvalsPath();
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as HumanEvalRecord[];
  } catch {
    return [];
  }
}

function saveHumanEvals(records: HumanEvalRecord[]) {
  const filePath = getHumanEvalsPath();
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2));

  // Also update latest-scorecard.json if it exists
  const scorecardPath = path.join(process.cwd(), "eval", "results", "latest-scorecard.json");
  if (fs.existsSync(scorecardPath)) {
    try {
      const rawScorecard = fs.readFileSync(scorecardPath, "utf-8");
      const scorecard = JSON.parse(rawScorecard);
      scorecard.humanEvaluation = loadHumanEvaluations();
      fs.writeFileSync(scorecardPath, JSON.stringify(scorecard, null, 2));
    } catch (e) {
      console.warn("Could not update scorecard with human eval:", e);
    }
  }
}

export async function GET() {
  try {
    const records = readHumanEvals();
    const summary = loadHumanEvaluations();
    return NextResponse.json({
      records,
      summary,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load human evals";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.caseId) {
      return NextResponse.json({ error: "Missing caseId" }, { status: 400 });
    }

    const record: HumanEvalRecord = {
      id: `heval-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      caseId: String(body.caseId),
      evaluatorName: String(body.evaluatorName || "Anonymous Evaluator"),
      accuracy: Math.min(5, Math.max(1, Number(body.accuracy) || 5)),
      evidenceQuality: Math.min(5, Math.max(1, Number(body.evidenceQuality) || 5)),
      groundedness: Math.min(5, Math.max(1, Number(body.groundedness) || 5)),
      taskCompletion: Math.min(5, Math.max(1, Number(body.taskCompletion) || 5)),
      clarity: Math.min(5, Math.max(1, Number(body.clarity) || 5)),
      trustworthiness: Math.min(5, Math.max(1, Number(body.trustworthiness) || 5)),
      passed: Boolean(body.passed ?? true),
      comments: String(body.comments || ""),
      timestamp: new Date().toISOString(),
    };

    const existing = readHumanEvals();
    existing.unshift(record);
    saveHumanEvals(existing);

    const summary = loadHumanEvaluations();
    return NextResponse.json({
      success: true,
      record,
      summary,
      totalReviews: existing.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save human evaluation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
