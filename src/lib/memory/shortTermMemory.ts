import { ConversationTurn, ShortTermContext } from "./types";

// Server-side module-level in-memory store surviving request instances in Node process
const sessionStore = new Map<string, ShortTermContext>();

export class ShortTermMemoryStore {
  /**
   * Retrieves or initializes the ShortTermContext for a given session ID.
   */
  public get(sessionId: string): ShortTermContext {
    let ctx = sessionStore.get(sessionId);
    if (!ctx) {
      ctx = {
        sessionId,
        turns: [],
        activeEntities: [],
        lastUpdated: new Date().toISOString(),
      };
      sessionStore.set(sessionId, ctx);
    }
    return ctx;
  }

  /**
   * Appends a new conversation turn and maintains a sliding window of max 8 turns.
   * Updates activeEntities and timestamp.
   */
  public addTurn(sessionId: string, turn: ConversationTurn): ShortTermContext {
    const ctx = this.get(sessionId);

    // Append new turn
    ctx.turns.push(turn);

    // Sliding window: keep last 8 turns, evict oldest
    if (ctx.turns.length > 8) {
      ctx.turns = ctx.turns.slice(-8);
    }

    // Merge new keyEntities into activeEntities (unique, max 15)
    if (turn.keyEntities && turn.keyEntities.length > 0) {
      const merged = Array.from(new Set([...turn.keyEntities, ...ctx.activeEntities]));
      ctx.activeEntities = merged.slice(0, 15);
    }

    ctx.lastUpdated = new Date().toISOString();
    sessionStore.set(sessionId, ctx);
    return ctx;
  }

  /**
   * Condenses recent turns + activeEntities into a short paragraph to inject into agent prompts.
   * Enables follow-up queries to resolve pronouns ("their", "they", "it") to active entities from prior turns.
   */
  public buildContextPrompt(context: ShortTermContext): string {
    if (!context || context.turns.length === 0) {
      return "";
    }

    const turnsSummary = context.turns
      .map((t) => `${t.role.toUpperCase()}: ${t.query || t.summary || ""}`)
      .join("\n");

    const entitiesSummary =
      context.activeEntities.length > 0
        ? `Active Entities in Session: ${context.activeEntities.join(", ")}`
        : "";

    return `[CONVERSATIONAL SHORT-TERM CONTEXT (Sliding Window)]
${entitiesSummary ? `${entitiesSummary}\n` : ""}Recent Conversation Turns:
${turnsSummary}

Instruction: Use the conversational context above to resolve ambiguous pronouns or references (e.g. "they", "their", "it", "that company", "the fab") to active entities mentioned in previous turns.`;
  }

  /**
   * Clears a session context if needed.
   */
  public clear(sessionId: string): void {
    sessionStore.delete(sessionId);
  }
}

export const shortTermMemoryStore = new ShortTermMemoryStore();
