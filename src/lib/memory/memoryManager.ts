import { shortTermMemoryStore, ShortTermMemoryStore } from "./shortTermMemory";
import { longTermMemoryStore, LongTermMemoryStore } from "./longTermMemory";
import {
  ShortTermContext,
  LongTermMemoryRecord,
  MemoryContextResult,
  CommitTurnInput,
} from "./types";

export class MemoryManager {
  private shortTerm: ShortTermMemoryStore;
  private longTerm: LongTermMemoryStore;

  constructor(
    shortTermStore: ShortTermMemoryStore = shortTermMemoryStore,
    longTermStore: LongTermMemoryStore = longTermMemoryStore
  ) {
    this.shortTerm = shortTermStore;
    this.longTerm = longTermStore;
  }

  /**
   * Retrieves both short-term conversational context and relevant long-term memory records.
   * Completely safe and non-blocking: never throws errors to caller.
   */
  public async getContext(
    sessionId: string,
    userId: string = "anonymous",
    query: string = ""
  ): Promise<MemoryContextResult> {
    try {
      const shortTermContext = this.shortTerm.get(sessionId);
      const shortTermPrompt = this.shortTerm.buildContextPrompt(shortTermContext);

      let relevantPastMemory: LongTermMemoryRecord[] = [];
      if (query && query.trim()) {
        relevantPastMemory = await this.longTerm.retrieve(query, userId, 3);
      }

      return {
        shortTermContext,
        shortTermPrompt,
        relevantPastMemory,
      };
    } catch (err) {
      console.warn("MemoryManager getContext failed silently:", err);
      return {
        shortTermContext: {
          sessionId,
          turns: [],
          activeEntities: [],
          lastUpdated: new Date().toISOString(),
        },
        shortTermPrompt: "",
        relevantPastMemory: [],
      };
    }
  }

  /**
   * Commits the current interaction turn to both Short-Term sliding window and Long-Term persistent store.
   * Completely safe and non-blocking: never throws errors to caller.
   */
  public async commit(
    sessionId: string,
    userId: string = "anonymous",
    input: CommitTurnInput
  ): Promise<void> {
    try {
      const now = new Date().toISOString();

      // 1. Commit user turn to Short-Term Memory
      this.shortTerm.addTurn(sessionId, {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `turn-u-${Date.now()}`,
        role: "user",
        query: input.query,
        keyEntities: input.keyEntities,
        timestamp: now,
      });

      // 2. Commit assistant turn to Short-Term Memory
      this.shortTerm.addTurn(sessionId, {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `turn-a-${Date.now()}`,
        role: "assistant",
        summary: input.summary,
        keyEntities: input.keyEntities,
        threatRating: input.threatRating,
        timestamp: now,
      });

      // 3. Commit long-term record to Long-Term Memory
      await this.longTerm.commit({
        userId,
        query: input.query,
        keyInsights: input.keyInsights,
        entities: input.keyEntities,
        threatRating: input.threatRating,
        groundedNodes: input.groundedNodes,
        timestamp: now,
      });
    } catch (err) {
      console.warn("MemoryManager commit failed silently:", err);
    }
  }
}

export const memoryManager = new MemoryManager();
