import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { TraceFile } from "../../../../../eval/types";
import { redactSensitiveData } from "@/lib/tracing/redactor";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { traceId: string } }
) {
  try {
    const { traceId } = params;
    const { searchParams } = new URL(req.url);
    const isExport = searchParams.get("export") === "true";

    const tracesDir = path.join(process.cwd(), "eval", "traces");

    const filePath =
      traceId === "latest"
        ? path.join(tracesDir, "latest.json")
        : path.join(tracesDir, `${traceId}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `Trace "${traceId}" not found. Run an investigation first.` },
        { status: 404 }
      );
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const traceFile: TraceFile = JSON.parse(raw);
    const sanitized = redactSensitiveData(traceFile);

    if (isExport) {
      return new NextResponse(JSON.stringify(sanitized, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="qyven-trace-${sanitized.traceId}.json"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      traceFile: sanitized,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to read trace";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
