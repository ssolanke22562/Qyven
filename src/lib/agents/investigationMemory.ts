import fs from "fs";
import path from "path";
import { QyvenState, QyvenCheckpoint } from "./qyvenState";

const MEMORY_FILE_PATH = path.join(process.cwd(), "data", "investigations.json");

export interface StoredInvestigation {
  investigationId: string;
  userQuery: string;
  timestamp: string;
  planObjective: string;
  confidenceScore: number;
  evidenceCount: number;
  conflictsCount: number;
  replansCount: number;
  summary: string;
  threatAssessment: string;
  executionHistory: any[];
  checkpoints: QyvenCheckpoint[];
}

export class InvestigationMemoryManager {
  private inMemoryCache: StoredInvestigation[] = [];
  private kvUrl: string;
  private kvToken: string;

  constructor() {
    this.kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
    this.kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
    this.initDefaultSeed();
  }

  private initDefaultSeed() {
    this.inMemoryCache = [
      {
        investigationId: "inv-seed-1",
        userQuery: "Analyze whether NVIDIA is becoming a major competitive threat in AI inference hardware.",
        timestamp: new Date().toISOString(),
        planObjective: "Analyze whether NVIDIA is becoming a major competitive threat in AI inference hardware.",
        confidenceScore: 79,
        evidenceCount: 7,
        conflictsCount: 1,
        replansCount: 1,
        summary: "Executive Briefing: Confirmed NVIDIA's strategic moves in custom AI inference silicon.",
        threatAssessment: "HIGH (Threat Index: 82/100)",
        executionHistory: [],
        checkpoints: [],
      },
    ];
  }

  private ensureMemoryFile() {
    try {
      const dir = path.dirname(MEMORY_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(MEMORY_FILE_PATH)) {
        fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(this.inMemoryCache, null, 2), "utf-8");
      }
    } catch (e) {
      console.warn("InvestigationMemoryManager: Read-only or ephemeral filesystem detected (Vercel serverless mode). Using in-memory & KV cache.");
    }
  }

  public async getAllInvestigationsAsync(): Promise<StoredInvestigation[]> {
    // 1. Try Upstash / Vercel KV if env vars present
    if (this.kvUrl && this.kvToken) {
      try {
        const res = await fetch(`${this.kvUrl}/get/qyven_investigations_history`, {
          headers: { Authorization: `Bearer ${this.token}` },
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.result) {
            const parsed = typeof data.result === "string" ? JSON.parse(data.result) : data.result;
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed;
            }
          }
        }
      } catch (e) {
        console.warn("KV fetch error for investigation memory:", e);
      }
    }

    // 2. Try Local File
    try {
      if (fs.existsSync(MEMORY_FILE_PATH)) {
        const content = fs.readFileSync(MEMORY_FILE_PATH, "utf-8");
        if (content.trim()) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.inMemoryCache = parsed;
          }
        }
      }
    } catch (e) {
      // Ephemeral disk warning
    }

    return this.inMemoryCache;
  }

  public getAllInvestigations(): StoredInvestigation[] {
    this.ensureMemoryFile();
    try {
      if (fs.existsSync(MEMORY_FILE_PATH)) {
        const content = fs.readFileSync(MEMORY_FILE_PATH, "utf-8");
        if (content.trim()) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.inMemoryCache = parsed;
          }
        }
      }
    } catch (e) {
      // Ephemeral filesystem on Vercel
    }
    return this.inMemoryCache;
  }

  public async saveInvestigationAsync(state: QyvenState): Promise<void> {
    const record: StoredInvestigation = {
      investigationId: state.investigationId,
      userQuery: state.userQuery,
      timestamp: new Date().toISOString(),
      planObjective: state.currentPlan.objective,
      confidenceScore: state.confidence.score,
      evidenceCount: state.evidenceTable.length,
      conflictsCount: state.conflicts.length,
      replansCount: state.budget.usedReplans,
      summary: state.finalReport?.summary || state.userQuery,
      threatAssessment: state.finalReport?.threatAssessment || "N/A",
      executionHistory: state.executionHistory,
      checkpoints: state.checkpoints,
    };

    // Update In-Memory Cache
    const idx = this.inMemoryCache.findIndex((i) => i.investigationId === state.investigationId);
    if (idx >= 0) {
      this.inMemoryCache[idx] = record;
    } else {
      this.inMemoryCache.unshift(record);
    }
    this.inMemoryCache = this.inMemoryCache.slice(0, 25);

    // Write to Upstash / Vercel KV if available
    if (this.kvUrl && this.kvToken) {
      try {
        await fetch(`${this.kvUrl}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(["SET", "qyven_investigations_history", JSON.stringify(this.inMemoryCache)]),
        });
      } catch (e) {
        console.warn("KV write error for investigation memory:", e);
      }
    }

    // Write to local disk if writable
    try {
      this.ensureMemoryFile();
      fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(this.inMemoryCache, null, 2), "utf-8");
    } catch (e) {
      console.warn("Local disk write skipped in Vercel serverless mode.");
    }
  }

  public saveInvestigation(state: QyvenState): void {
    this.saveInvestigationAsync(state).catch((e) => console.warn("saveInvestigationAsync error:", e));
  }

  public findPastInvestigationByQuery(query: string): StoredInvestigation | null {
    const all = this.getAllInvestigations();
    const qLower = query.toLowerCase();
    return all.find((i) => i.userQuery.toLowerCase().includes(qLower) || qLower.includes(i.userQuery.toLowerCase())) || null;
  }

  private get token(): string {
    return this.kvToken;
  }
}

export const investigationMemory = new InvestigationMemoryManager();
