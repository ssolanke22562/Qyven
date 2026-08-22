import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

function readJsonIfExists(filePath: string) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export async function GET() {
  try {
    const root = process.cwd();
    const scorecardPath = path.join(root, "eval", "results", "latest-scorecard.json");
    const resultsPath = path.join(root, "eval", "results", "latest.json");
    const markdownPath = path.join(root, "eval", "scorecard.md");

    const scorecard = readJsonIfExists(scorecardPath);
    const manifest = readJsonIfExists(resultsPath);
    const markdown = fs.existsSync(markdownPath)
      ? fs.readFileSync(markdownPath, "utf-8")
      : null;

    if (!scorecard && !manifest) {
      return NextResponse.json(
        {
          error: "No evaluation results found. Run `npm run eval` first.",
        },
        { status: 404 }
      );
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
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load scorecard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
