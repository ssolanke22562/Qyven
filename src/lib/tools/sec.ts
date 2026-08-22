import { ToolExecutionResult } from "./patent";

export interface SecFilingItem {
  accessionNumber: string;
  formType: "10-K" | "10-Q" | "8-K" | "S-1";
  companyName: string;
  filingDate: string;
  headline: string;
  summary: string;
  url: string;
  relevanceScore: number;
}

export async function searchSecFilings(
  query: string,
  options?: { forceFailure?: boolean }
): Promise<ToolExecutionResult<SecFilingItem>> {
  const startTime = Date.now();

  if (options?.forceFailure) {
    return {
      success: false,
      data: [],
      error: {
        code: "UNAVAILABLE",
        message: "SEC EDGAR Financial Data Feed API down (500 Internal Server Error)",
        recoverable: true,
      },
      latencyMs: Date.now() - startTime,
    };
  }

  const isNvidia = query.toLowerCase().includes("nvidia");
  const isTesla = query.toLowerCase().includes("tesla");

  const companyName = isNvidia ? "NVIDIA CORP" : isTesla ? "TESLA INC" : "TARGET ENTERPRISE CORP";

  const data: SecFilingItem[] = [
    {
      accessionNumber: "0001045810-24-000012",
      formType: "10-K",
      companyName,
      filingDate: "2024-02-21",
      headline: `${companyName} Form 10-K Annual Report: R&D & Capital Allocation Strategy`,
      summary: `${companyName} confirmed $9.8B annual R&D expenditure dedicated to next-generation AI silicon, custom NPU architectures, and 2nm foundry substrate reservations.`,
      url: "https://www.sec.gov/edgar",
      relevanceScore: 0.98,
    },
    {
      accessionNumber: "0001045810-24-000045",
      formType: "8-K",
      companyName,
      filingDate: "2024-05-14",
      headline: `${companyName} Form 8-K Current Report: Strategic Supply & Wafer Supply Agreement`,
      summary: "Executed multi-year supply commitment for advanced 2nm wafer capacity and high-bandwidth memory (HBM3e/HBM4) stack integration.",
      url: "https://www.sec.gov/edgar",
      relevanceScore: 0.95,
    },
  ];

  return {
    success: true,
    data,
    latencyMs: Date.now() - startTime,
  };
}
