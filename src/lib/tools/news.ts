export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  description: string;
}

/**
 * Searches recent news for current events, market moves, or competitor announcements.
 * Supports NewsData.io (pub_* keys), GNews, and NewsAPI.org via process.env.NEWS_API_KEY.
 * Handles missing keys and network errors gracefully by returning an empty array.
 */
export async function searchNews(query: string): Promise<NewsArticle[]> {
  if (!query || !query.trim()) return [];

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
      const res = await fetch(url, { next: { revalidate: 1800 } });

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

    // 2. Try NewsAPI.org endpoint
    let url = `https://newsapi.org/v2/everything?q=${cleanQuery}&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`;
    let res = await fetch(url, {
      headers: { "User-Agent": "AgentX-Oracle/1.0" },
      next: { revalidate: 1800 },
    });

    // 3. Fallback to GNews.io endpoint
    if (!res.ok) {
      url = `https://gnews.io/api/v4/search?q=${cleanQuery}&max=5&apikey=${apiKey}`;
      res = await fetch(url, { next: { revalidate: 1800 } });
    }

    if (!res.ok) {
      console.warn(`News API query failed with HTTP status ${res.status}`);
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
    console.warn("searchNews error:", error);
    return [];
  }
}
