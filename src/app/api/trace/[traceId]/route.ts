import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { TraceFile } from "../../../../../eval/types";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { traceId: string } }
) {
  try {
    const { traceId } = params;
    const tracesDir = path.join(process.cwd(), "eval", "traces");

    const filePath =
      traceId === "latest"
        ? path.join(tracesDir, "latest.json")
        : path.join(tracesDir, `${traceId}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `Trace "${traceId}" not found. Run a query first to generate a trace.` },
        { status: 404 }
      );
    }

    const traceFile: TraceFile = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    return NextResponse.json({
      success: true,
      traceFile,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to read trace";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
