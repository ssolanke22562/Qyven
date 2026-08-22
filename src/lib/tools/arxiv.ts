export interface ArxivPaper {
  title: string;
  authors: string[];
  summary: string;
  link: string;
  published: string;
}

/**
 * Searches ArXiv for academic papers relevant to the query.
 * Uses the free public ArXiv API (Atom XML format).
 */
export async function searchArxiv(query: string): Promise<ArxivPaper[]> {
  if (!query || !query.trim()) return [];

  try {
    const cleanQuery = encodeURIComponent(query.trim());
    const url = `https://export.arxiv.org/api/query?search_query=all:${cleanQuery}&start=0&max_results=5`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "AgentX-Oracle/1.0",
      },
      next: { revalidate: 3600 }, // cache for 1 hr
    });

    if (!res.ok) {
      console.warn(`ArXiv API returned status ${res.status}`);
      return [];
    }

    const xmlText = await res.text();
    return parseArxivXml(xmlText);
  } catch (error) {
    console.warn("ArXiv API search error:", error);
    return [];
  }
}

/**
 * Lightweight regex-based Atom XML parser for ArXiv entries.
 * Avoids extra node dependencies.
 */
function parseArxivXml(xml: string): ArxivPaper[] {
  const papers: ArxivPaper[] = [];
  const entryMatches = xml.match(/<entry>[\s\S]*?<\/entry>/gi);

  if (!entryMatches) return [];

  for (const entryXml of entryMatches) {
    try {
      // Extract Title
      const titleMatch = entryXml.match(/<title>([\s\S]*?)<\/title>/i);
      let title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "Untitled";

      // Extract Summary
      const summaryMatch = entryXml.match(/<summary>([\s\S]*?)<\/summary>/i);
      let summary = summaryMatch ? summaryMatch[1].replace(/\s+/g, " ").trim() : "";

      // Extract Link (id or alternate link)
      const linkMatch = entryXml.match(/<id>([\s\S]*?)<\/id>/i) || entryXml.match(/<link[^>]*href="([^"]+)"/i);
      let link = linkMatch ? linkMatch[1].trim() : "";
      if (link.startsWith("http://arxiv.org/abs/")) {
        link = link.replace("http://arxiv.org/abs/", "https://arxiv.org/abs/");
      }

      // Extract Published Date
      const pubMatch = entryXml.match(/<published>([\s\S]*?)<\/published>/i);
      const published = pubMatch ? pubMatch[1].trim().substring(0, 10) : "";

      // Extract Authors
      const authors: string[] = [];
      const authorMatches = entryXml.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/gi);
      if (authorMatches) {
        for (const authorXml of authorMatches) {
          const nameMatch = authorXml.match(/<name>([\s\S]*?)<\/name>/i);
          if (nameMatch) {
            authors.push(nameMatch[1].trim());
          }
        }
      }

      papers.push({
        title,
        authors,
        summary: summary.length > 250 ? summary.substring(0, 250) + "..." : summary,
        link,
        published,
      });
    } catch (err) {
      console.warn("Failed to parse single ArXiv entry:", err);
    }
  }

  return papers;
}
