import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { buildScorecard } from "../../../../../eval/scoreResults";

export const dynamic = "force-dynamic";

function readJsonIfExists(filePath: string) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const root = process.cwd();
    const scorecardPath = path.join(root, "eval", "results", "latest-scorecard.json");
    const resultsPath = path.join(root, "eval", "results", "latest.json");
    const markdownPath = path.join(root, "eval", "scorecard.md");

    let scorecard = readJsonIfExists(scorecardPath);
    const manifest = readJsonIfExists(resultsPath);
    const markdown = fs.existsSync(markdownPath)
      ? fs.readFileSync(markdownPath, "utf-8")
      : null;

    if (!scorecard && manifest) {
      try {
        scorecard = buildScorecard(manifest, resultsPath);
      } catch (err) {
        console.warn("Failed to build scorecard from manifest:", err);
      }
    }

    if (!scorecard && !manifest) {
      return NextResponse.json({
        scorecard: null,
        manifest: null,
        markdown: null,
        notMeasured: true,
        message: "Awaiting evaluation data. Click 'RUN FULL EVALUATION' to execute tests.",
      });
    }

    return NextResponse.json({
      scorecard,
      manifest: manifest
        ? {
            runId: manifest.runId,
            startedAt: manifest.startedAt,
            finishedAt: manifest.finishedAt,
            mode: manifest.mode,
            env: manifest.env,
            caseCount: manifest.cases?.length ?? 0,
          }
        : null,
      markdown,
      notMeasured: false,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load scorecard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
