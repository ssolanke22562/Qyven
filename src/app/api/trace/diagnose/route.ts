import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { diagnoseTrace, writeDiagnosis, readTraceFile } from "@/lib/tracing/diagnose";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { traceId = "latest" } = body;

    const traceFile = readTraceFile(traceId);
    if (!traceFile) {
      return NextResponse.json(
        { error: `Trace "${traceId}" not found. Run a query first.` },
        { status: 404 }
      );
    }

    const diagnosis = diagnoseTrace(traceFile);
    const savedPath = writeDiagnosis(diagnosis);

    return NextResponse.json({
      success: true,
      diagnosis,
      savedTo: savedPath,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Diagnosis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const latestDiagnosisPath = path.join(process.cwd(), "eval", "diagnoses", "latest.json");
    if (!fs.existsSync(latestDiagnosisPath)) {
      return NextResponse.json({
        diagnosis: null,
        message: "No diagnosis yet. Run a query with a failure mode, then call POST to diagnose.",
      });
    }
    const diagnosis = JSON.parse(fs.readFileSync(latestDiagnosisPath, "utf-8"));
    return NextResponse.json({ success: true, diagnosis });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to read diagnosis";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
