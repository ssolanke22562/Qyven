export interface ConversationTurn {
  id: string;
  role: "user" | "assistant";
  query?: string;
  summary?: string;
  keyEntities?: string[];
  threatRating?: string;
  timestamp: string;
}

export interface ShortTermContext {
  sessionId: string;
  turns: ConversationTurn[];      // sliding window, max 8
  activeEntities: string[];       // recently mentioned entities
  lastUpdated: string;
}

export interface LongTermMemoryRecord {
  id: string;
  userId: string;                 // default "anonymous"
  query: string;
  keyInsights: string[];
  entities: string[];
  threatRating: string;
  groundedNodes: string[];
  timestamp: string;
  relevanceScore?: number;        // computed at retrieval time
}

export interface MemoryPersistenceAdapter {
  read(userId: string): Promise<LongTermMemoryRecord[]>;
  write(record: LongTermMemoryRecord): Promise<void>;
}

export interface MemoryContextResult {
  shortTermContext: ShortTermContext;
  shortTermPrompt: string;
  relevantPastMemory: LongTermMemoryRecord[];
}

export interface CommitTurnInput {
  query: string;
  summary: string;
  keyEntities: string[];
  threatRating: string;
  groundedNodes: string[];
  keyInsights: string[];
}
