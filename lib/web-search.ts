export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

const SEARCH_TIMEOUT_MS = 5000;
const MAX_RESULTS = 5;
const RATE_LIMIT_MS = 10_000;

// ── Rate limiting (in-memory, per-user) ─────────────────────────────

const searchTimestamps = new Map<string, number>();

/**
 * Returns true if the user has searched within the last RATE_LIMIT_MS.
 * Automatically records the timestamp when not rate-limited.
 */
export function isSearchRateLimited(userId: string): boolean {
  const now = Date.now();
  const last = searchTimestamps.get(userId);
  if (last && now - last < RATE_LIMIT_MS) {
    return true;
  }
  searchTimestamps.set(userId, now);
  return false;
}

// ── Query classification ────────────────────────────────────────────

/** Patterns that indicate a farm-data-only question (no web search needed). */
const FARM_ONLY_PATTERNS = [
  /\b(mi|mis|my|our|the)\s+(lote|batch|cerdo|pig|animal|granja|farm)/i,
  /\b(lote|batch)\s*[-#]?\s*[\w-]+/i,
  /\b(cuánto|cuánta|cuántos|cuántas|how\s+much|how\s+many)\b/i,
  /\b(fcr|feed\s*conversion|conversión\s*alimenticia)/i,
  /\b(schedule|programa|vacuna|desparasit)/i,
  /\b(expense|gasto|costo\s+total|total\s+cost)\b/i,
  /\b(peso\s+promedio|average\s+weight|weight\s+gain)\b/i,
  /\b(mejor\s+lote|best\s+batch|worst\s+batch|peor\s+lote)\b/i,
];

/**
 * Returns true if the message likely needs web results.
 * Farm-only questions are skipped to avoid unnecessary external requests.
 */
export function shouldSearch(message: string): boolean {
  return !FARM_ONLY_PATTERNS.some((p) => p.test(message));
}

// ── Query sanitization ──────────────────────────────────────────────

/** Patterns to strip from the query before sending to DuckDuckGo. */
const SANITIZE_PATTERNS = [
  /\b(lote|batch)\s*[-#]?\s*[\w-]+/gi,
  /\$\s*[\d,.]+/g,
  /\d+\s*(kg|lb|kilogram|pound|libra)s?/gi,
];

/**
 * Strips farm-specific identifiers (batch names, amounts, weights)
 * so they don't leak to the search engine.
 */
export function sanitizeQuery(message: string): string {
  let q = message;
  for (const pattern of SANITIZE_PATTERNS) {
    q = q.replace(pattern, "");
  }
  return q.replace(/\s+/g, " ").trim();
}

// ── Web search ──────────────────────────────────────────────────────

/**
 * Searches DuckDuckGo HTML lite and returns parsed results.
 * Only the sanitized query goes to the internet — no farm data is sent.
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

// ── HTML parsing ────────────────────────────────────────────────────

/**
 * Parses DuckDuckGo HTML lite response into structured results.
 * Uses a two-pass approach: match the full <a> tag, then extract
 * href separately — so attribute order doesn't matter.
 */
function parseResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];

  // Match full <a> tags that contain class="result__a" (any attribute order)
  const linkTagRegex = /<a\s[^>]*class="result__a"[^>]*>[\s\S]*?<\/a>/gi;
  const snippetTagRegex = /<a\s[^>]*class="result__snippet"[^>]*>[\s\S]*?<\/a>/gi;
  const hrefRegex = /href="([^"]*)"/i;

  const links: { url: string; title: string }[] = [];
  let tagMatch;

  while ((tagMatch = linkTagRegex.exec(html)) !== null) {
    const fullTag = tagMatch[0];
    const hrefMatch = hrefRegex.exec(fullTag);
    const rawUrl = hrefMatch?.[1] ?? "";
    // Extract inner text (everything between > and </a>)
    const innerMatch = fullTag.match(/>([^]*?)<\/a>/i);
    const title = stripHtml(innerMatch?.[1] ?? "").trim();
    const resolved = resolveUrl(rawUrl);
    if (title && resolved) {
      links.push({ url: resolved, title });
    }
  }

  const snippets: string[] = [];
  while ((tagMatch = snippetTagRegex.exec(html)) !== null) {
    const innerMatch = tagMatch[0].match(/>([^]*?)<\/a>/i);
    snippets.push(stripHtml(innerMatch?.[1] ?? "").trim());
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
    if (raw.includes("uddg=")) {
      const url = new URL(raw, "https://duckduckgo.com");
      const uddg = url.searchParams.get("uddg");
      return uddg ?? raw;
    }
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

  const lines = ["\n--- WEB SEARCH RESULTS ---"];
  for (const r of results) {
    lines.push(`Title: ${r.title}`);
    if (r.snippet) {
      lines.push(`Summary: ${r.snippet}`);
    }
    lines.push(`Source: ${r.url}`);
    lines.push("");
  }

  return lines.join("\n");
}
