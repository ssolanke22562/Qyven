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
  private ensureMemoryFile() {
    try {
      const dir = path.dirname(MEMORY_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(MEMORY_FILE_PATH)) {
        fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
      }
    } catch (e) {
      console.warn("Failed to initialize investigation memory file:", e);
    }
  }

  public getAllInvestigations(): StoredInvestigation[] {
    this.ensureMemoryFile();
    try {
      if (fs.existsSync(MEMORY_FILE_PATH)) {
        const content = fs.readFileSync(MEMORY_FILE_PATH, "utf-8");
        return JSON.parse(content);
      }
    } catch (e) {
      console.warn("Failed to read investigations memory:", e);
    }
    return [];
  }

  public saveInvestigation(state: QyvenState): void {
    this.ensureMemoryFile();
    try {
      const all = this.getAllInvestigations();
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

      // Replace if exists, else append
      const idx = all.findIndex((i) => i.investigationId === state.investigationId);
      if (idx >= 0) {
        all[idx] = record;
      } else {
        all.unshift(record);
      }

      fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(all.slice(0, 25), null, 2), "utf-8");
    } catch (e) {
      console.warn("Failed to save investigation to memory:", e);
    }
  }

  public findPastInvestigationByQuery(query: string): StoredInvestigation | null {
    const all = this.getAllInvestigations();
    const qLower = query.toLowerCase();
    return all.find((i) => i.userQuery.toLowerCase().includes(qLower) || qLower.includes(i.userQuery.toLowerCase())) || null;
  }
}

export const investigationMemory = new InvestigationMemoryManager();
