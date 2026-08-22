import fs from "fs";
import path from "path";
import { LongTermMemoryRecord, MemoryPersistenceAdapter } from "./types";

/**
 * FileAdapter: Node fs-based persistence storing records in data/longTermMemory.json.
 * Zero-config default fallback for local dev & serverless disk persistence.
 */
export class FileAdapter implements MemoryPersistenceAdapter {
  private filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), "data", "longTermMemory.json");
  }

  private ensureDirectoryExists(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  public async read(userId: string): Promise<LongTermMemoryRecord[]> {
    try {
      if (!fs.existsSync(this.filePath)) {
        return [];
      }
      const raw = fs.readFileSync(this.filePath, "utf-8");
      if (!raw.trim()) return [];
      const records: LongTermMemoryRecord[] = JSON.parse(raw);
      // Return records matching user or anonymous fallback
      return records.filter((r) => !userId || r.userId === userId || r.userId === "anonymous" || userId === "anonymous");
    } catch (err) {
      console.warn("FileAdapter read warning:", err);
      return [];
    }
  }

  public async write(record: LongTermMemoryRecord): Promise<void> {
    try {
      this.ensureDirectoryExists();
      let records: LongTermMemoryRecord[] = [];
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        if (raw.trim()) {
          records = JSON.parse(raw);
        }
      }
      records.push(record);
      fs.writeFileSync(this.filePath, JSON.stringify(records, null, 2), "utf-8");
    } catch (err) {
      console.warn("FileAdapter write warning:", err);
    }
  }
}

/**
 * UpstashAdapter: Vercel KV / Upstash Redis persistence via REST API.
 * Automatically active if KV_REST_API_URL and KV_REST_API_TOKEN env vars are present.
 */
export class UpstashAdapter implements MemoryPersistenceAdapter {
  private url: string;
  private token: string;
  private fallbackFileAdapter: FileAdapter;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
    this.fallbackFileAdapter = new FileAdapter();
  }

  public async read(userId: string): Promise<LongTermMemoryRecord[]> {
    try {
      const key = `memory_records_${userId || "anonymous"}`;
      const res = await fetch(`${this.url}/get/${key}`, {
        headers: { Authorization: `Bearer ${this.token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        return this.fallbackFileAdapter.read(userId);
      }

      const data = await res.json();
      if (!data.result) return [];
      const parsed = typeof data.result === "string" ? JSON.parse(data.result) : data.result;
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn("UpstashAdapter read error, using FileAdapter fallback:", err);
      return this.fallbackFileAdapter.read(userId);
    }
  }

  public async write(record: LongTermMemoryRecord): Promise<void> {
    try {
      const existing = await this.read(record.userId);
      existing.push(record);
      const key = `memory_records_${record.userId || "anonymous"}`;

      const res = await fetch(`${this.url}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["SET", key, JSON.stringify(existing)]),
      });

      if (!res.ok) {
        await this.fallbackFileAdapter.write(record);
      }
    } catch (err) {
      console.warn("UpstashAdapter write error, using FileAdapter fallback:", err);
      await this.fallbackFileAdapter.write(record);
    }
  }
}

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "of", "to", "in", "on", "for",
  "and", "or", "what", "how", "why", "who", "tell", "me", "about", "with", "their",
  "they", "this", "that", "it", "from", "by", "at", "as", "be", "has", "have", "had"
]);

/**
 * LongTermMemoryStore: Cross-session persistent memory store.
 * Performs keyword & entity overlap scoring for retrieval.
 */
export class LongTermMemoryStore {
  private adapter: MemoryPersistenceAdapter;

  constructor() {
    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (kvUrl && kvToken) {
      this.adapter = new UpstashAdapter(kvUrl, kvToken);
    } else {
      this.adapter = new FileAdapter();
    }
  }

  /**
   * Retrieves top K past memory records matching the query via keyword & entity overlap scoring.
   */
  public async retrieve(
    query: string,
    userId: string = "anonymous",
    topK: number = 3
  ): Promise<LongTermMemoryRecord[]> {
    if (!query || !query.trim()) return [];

    const allRecords = await this.adapter.read(userId);
    if (allRecords.length === 0) return [];

    const rawTokens = query
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));

    const scoredRecords = allRecords.map((record) => {
      let score = 0;
      const lowerQuery = query.toLowerCase();

      // Entity matches (+3 per match)
      record.entities.forEach((entity) => {
        const lowerEntity = entity.toLowerCase();
        if (lowerQuery.includes(lowerEntity) || rawTokens.some((t) => lowerEntity.includes(t))) {
          score += 3;
        }
      });

      // Grounded node matches (+3 per match)
      record.groundedNodes.forEach((node) => {
        if (rawTokens.some((t) => node.toLowerCase().includes(t))) {
          score += 3;
        }
      });

      // Original query token matches (+2 per match)
      const recordQueryLower = record.query.toLowerCase();
      rawTokens.forEach((t) => {
        if (recordQueryLower.includes(t)) {
          score += 2;
        }
      });

      // Key insights matches (+1 per match)
      record.keyInsights.forEach((insight) => {
        const lowerInsight = insight.toLowerCase();
        rawTokens.forEach((t) => {
          if (lowerInsight.includes(t)) {
            score += 1;
          }
        });
      });

      return {
        ...record,
        relevanceScore: score,
      };
    });

    return scoredRecords
      .filter((r) => (r.relevanceScore || 0) > 0)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, topK);
  }

  /**
   * Commits a new long-term memory record to persistence.
   */
  public async commit(
    recordInput: Omit<LongTermMemoryRecord, "id" | "timestamp"> & { id?: string; timestamp?: string }
  ): Promise<LongTermMemoryRecord> {
    const record: LongTermMemoryRecord = {
      id: recordInput.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ltm-${Date.now()}`),
      userId: recordInput.userId || "anonymous",
      query: recordInput.query,
      keyInsights: recordInput.keyInsights || [],
      entities: recordInput.entities || [],
      threatRating: recordInput.threatRating || "NOMINAL",
      groundedNodes: recordInput.groundedNodes || [],
      timestamp: recordInput.timestamp || new Date().toISOString(),
    };

    await this.adapter.write(record);
    return record;
  }
}

export const longTermMemoryStore = new LongTermMemoryStore();
