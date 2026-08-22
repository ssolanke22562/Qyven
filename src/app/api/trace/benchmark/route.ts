import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const benchmarkPath = path.join(process.cwd(), "eval", "results", "benchmark-comparison.json");
    if (!fs.existsSync(benchmarkPath)) {
      return NextResponse.json({
        comparison: null,
        message: "No benchmark yet. Run: npm run trace-benchmark",
      });
    }
    const comparison = JSON.parse(fs.readFileSync(benchmarkPath, "utf-8"));
    return NextResponse.json({ success: true, comparison });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to read benchmark";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
