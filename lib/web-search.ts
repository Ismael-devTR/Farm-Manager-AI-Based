export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

const SEARCH_TIMEOUT_MS = 5000;
const MAX_RESULTS = 5;

/**
 * Searches DuckDuckGo HTML lite and returns parsed results.
 * Only the user's query goes to the internet — no farm data is sent.
 * Returns an empty array on any failure (non-blocking).
 */
export async function webSearch(query: string): Promise<SearchResult[]> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encoded}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FarmManager/1.0)",
      },
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    return parseResults(html);
  } catch {
    return [];
  }
}

/**
 * Parses DuckDuckGo HTML lite response into structured results.
 */
function parseResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];

  // DuckDuckGo lite wraps each result in a <a class="result-link"> for the title/url
  // and <td class="result-snippet"> for the snippet.
  // Match result links: <a rel="nofollow" class="result__a" href="...">title</a>
  const linkRegex = /<a[^>]+class="result__a"[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRegex = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

  const links: { url: string; title: string }[] = [];
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const rawUrl = match[1];
    const title = stripHtml(match[2]).trim();
    // DuckDuckGo lite URLs are sometimes redirected through uddg param
    const resolved = resolveUrl(rawUrl);
    if (title && resolved) {
      links.push({ url: resolved, title });
    }
  }

  const snippets: string[] = [];
  while ((match = snippetRegex.exec(html)) !== null) {
    snippets.push(stripHtml(match[1]).trim());
  }

  for (let i = 0; i < Math.min(links.length, MAX_RESULTS); i++) {
    results.push({
      title: links[i].title,
      url: links[i].url,
      snippet: snippets[i] ?? "",
    });
  }

  return results;
}

/**
 * Resolves DuckDuckGo redirect URLs to the actual destination.
 */
function resolveUrl(raw: string): string {
  try {
    // DDG lite often uses: //duckduckgo.com/l/?uddg=<encoded_url>&...
    if (raw.includes("uddg=")) {
      const url = new URL(raw, "https://duckduckgo.com");
      const uddg = url.searchParams.get("uddg");
      return uddg ?? raw;
    }
    // Already a direct URL
    if (raw.startsWith("http")) {
      return raw;
    }
    return raw;
  } catch {
    return raw;
  }
}

/**
 * Strips HTML tags and decodes common entities.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Formats search results into a context string for the LLM prompt.
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return "";
  }

  const lines = ["--- WEB SEARCH RESULTS ---"];
  for (const r of results) {
    lines.push(`Title: ${r.title}`);
    if (r.snippet) {
      lines.push(`Summary: ${r.snippet}`);
    }
    lines.push(`Source: ${r.url}`);
    lines.push("");
  }

  return "\n" + lines.join("\n");
}
