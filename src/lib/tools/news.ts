export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  description: string;
}

// ─────────────────────────────────────────────────────────────
// Retry helper with exponential backoff (FIX: Added after
// news-503 controlled failure diagnosis showed 0 sources → 
// hallucination risk. Trace ID: trace-news-503-diagnosis.json)
// ─────────────────────────────────────────────────────────────
async function retryFetch(
  url: string,
  opts: RequestInit & { next?: { revalidate: number } },
  maxRetries = 2,
  baseDelayMs = 500
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = baseDelayMs * Math.pow(2, attempt - 1); // 500ms, 1000ms
      await new Promise((r) => setTimeout(r, delay));
    }
    try {
      const res = await fetch(url, opts);
      // Retry on 429 (rate-limit) and 5xx (server errors)
      if (res.ok || (res.status < 500 && res.status !== 429)) {
        return res;
      }
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err: any) {
      lastError = err;
    }
  }
  throw lastError ?? new Error("retryFetch: all attempts exhausted");
}

/**
 * Searches recent news for current events, market moves, or competitor announcements.
 * Supports NewsData.io (pub_* keys), GNews, and NewsAPI.org via process.env.NEWS_API_KEY.
 * 
 * FIX APPLIED (Aug 2026): Added retry-with-exponential-backoff (2 retries, 500ms/1000ms).
 * Root cause from trace diagnosis: news-503 failures caused 0 sources in synthesis → 
 * elevated hallucination risk. Retry gives the API a chance to recover before falling back.
 */
export async function searchNews(
  query: string,
  opts?: { forceFailure?: boolean }
): Promise<NewsArticle[]> {
  if (!query || !query.trim()) return [];

  // Controlled failure injection (used by stateGraph demoOptions)
  if (opts?.forceFailure) {
    throw new Error("News API 503 Service Unavailable (Forced Failure)");
  }

  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    console.warn("searchNews: NEWS_API_KEY is not set in environment variables. Returning empty results.");
    return [];
  }

  try {
    const cleanQuery = encodeURIComponent(query.trim());
    const articles: NewsArticle[] = [];

    // 1. If key starts with 'pub_', use NewsData.io endpoint
    if (apiKey.startsWith("pub_")) {
      const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${cleanQuery}&language=en`;
      const res = await retryFetch(url, { next: { revalidate: 1800 } });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results)) {
          for (const item of data.results.slice(0, 5)) {
            articles.push({
              title: item.title || "Untitled News Article",
              source: item.source_id || item.source_name || "News Provider",
              url: item.link || item.url || "#",
              publishedAt: item.pubDate ? item.pubDate.substring(0, 10) : "",
              description: item.description ? (item.description.length > 200 ? item.description.substring(0, 200) + "..." : item.description) : "",
            });
          }
          return articles;
        }
      }
    }

    // 2. Try NewsAPI.org endpoint (with retry)
    let url = `https://newsapi.org/v2/everything?q=${cleanQuery}&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`;
    let res = await retryFetch(url, {
      headers: { "User-Agent": "AgentX-Oracle/1.0" },
      next: { revalidate: 1800 },
    });

    // 3. Fallback to GNews.io endpoint (with retry)
    if (!res.ok) {
      url = `https://gnews.io/api/v4/search?q=${cleanQuery}&max=5&apikey=${apiKey}`;
      res = await retryFetch(url, { next: { revalidate: 1800 } });
    }

    if (!res.ok) {
      console.warn(`News API query failed with HTTP status ${res.status} after retries.`);
      return [];
    }

    const data = await res.json();

    // Parse NewsAPI or GNews format
    const rawList = data.articles || data.results || [];
    if (Array.isArray(rawList)) {
      for (const item of rawList.slice(0, 5)) {
        articles.push({
          title: item.title || "Untitled Article",
          source: item.source?.name || item.source_id || "News Source",
          url: item.url || item.link || "#",
          publishedAt: item.publishedAt || item.pubDate ? (item.publishedAt || item.pubDate).substring(0, 10) : "",
          description: item.description ? (item.description.length > 200 ? item.description.substring(0, 200) + "..." : item.description) : "",
        });
      }
    }

    return articles;
  } catch (error) {
    console.warn("searchNews error (after retries):", error);
    return [];
  }
}
