import "server-only";

/**
 * Knowledge search, backed by the Salesforce Data 360 Vector Database.
 *
 * This is the only place the site talks to Salesforce: the client credentials
 * stay server-side and the browser only ever sees tidied-up hits.
 *
 * The index stores one row per *chunk*, so several rows can come from the same
 * article. Results are collapsed to one hit per source, best score wins.
 */

const SF_DOMAIN = process.env.SF_DOMAIN?.replace(/\/$/, "");
const SF_CLIENT_ID = process.env.SF_CLIENT_ID;
const SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET;
const INDEX = process.env.SF_SEARCH_INDEX ?? "KA_Brightline_KB";

const API_VERSION = "v62.0";

export interface SearchHit {
  /** Salesforce record id today; a page URL once the sitemap index is live. */
  sourceId: string;
  score: number;
  /** First line of the best-matching chunk — normally the article title. */
  title: string;
  snippet: string;
  /** Derived from `sourceId` when it is a URL on this site, else null. */
  slug: string | null;
}

export interface SearchResponse {
  hits: SearchHit[];
  index: string;
  /** False when Salesforce credentials are absent, so the UI can say so. */
  configured: boolean;
}

const isConfigured = () =>
  Boolean(SF_DOMAIN && SF_CLIENT_ID && SF_CLIENT_SECRET);

/**
 * Cached in module memory. Each serverless instance fetches once; the token
 * lives ~2h and is refreshed well before expiry.
 */
let cachedToken: { token: string; expiresAt: number } | null = null;

const getToken = async (): Promise<string> => {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const response = await fetch(`${SF_DOMAIN}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: SF_CLIENT_ID!,
      client_secret: SF_CLIENT_SECRET!,
    }),
    cache: "no-store",
  });

  const body = await response.json();

  if (!body.access_token) {
    throw new Error(
      `Salesforce token request failed (${response.status}): ${
        body.error_description ?? body.error ?? "no access_token"
      }`,
    );
  }

  cachedToken = {
    token: body.access_token,
    expiresAt: Date.now() + 50 * 60 * 1000,
  };

  return body.access_token;
};

/**
 * Pulls a slug out of a hit's source.
 *
 * The Data Library index built from Knowledge returns record ids, which carry
 * no slug. Once the index is rebuilt from this site's sitemap the source is a
 * page URL and the last path segment is the slug.
 */
const slugFromSource = (sourceId: string): string | null => {
  if (!/^https?:\/\//i.test(sourceId)) return null;

  try {
    const segments = new URL(sourceId).pathname.split("/").filter(Boolean);
    return segments.length ? segments[segments.length - 1] : null;
  } catch {
    return null;
  }
};

/** Chunks are newline-delimited: title, then summary/body. */
const splitChunk = (chunk: string) => {
  const [first = "", ...rest] = String(chunk).split("\n");
  return {
    title: first.trim(),
    snippet: rest.join(" ").trim().slice(0, 240),
  };
};

export interface SearchOptions {
  /** Maximum hits returned after chunks are collapsed. */
  limit?: number;
  minScore?: number;
}

export const isSearchConfigured = isConfigured;

export const searchIndexName = () => INDEX;

/**
 * Runs a vector search and collapses chunks to one hit per source article.
 *
 * Throws on transport or auth failure so callers can decide between showing an
 * error and falling back; an empty result set is never used to signal one.
 */
export const searchKnowledgeIndex = async (
  query: string,
  { limit = 10, minScore = 0 }: SearchOptions = {},
): Promise<SearchHit[]> => {
  if (!isConfigured() || !query.trim()) return [];

  const size = Math.min(limit, 50);

  // Over-fetch: several chunks can belong to one article and collapse into a
  // single hit, so k*3 rows keeps the final count close to k.
  const escaped = query.replace(/'/g, "''");
  const sql = `SELECT v.score__c, c.SourceRecordId__c, c.Chunk__c
    FROM vector_search(table(${INDEX}_index__dlm), '${escaped}', '', ${size * 3}) v
    JOIN ${INDEX}_chunk__dlm c ON v.RecordId__c = c.RecordId__c`;

  const response = await fetch(
    `${SF_DOMAIN}/services/data/${API_VERSION}/ssot/query-sql`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql }),
      cache: "no-store",
    },
  );

  const body = await response.json();

  if (!Array.isArray(body.data)) {
    throw new Error(
      `Data 360 search failed (${response.status}): ${JSON.stringify(body).slice(0, 300)}`,
    );
  }

  const best = new Map<string, SearchHit>();

  for (const row of body.data as [number, string, string][]) {
    const [score, sourceId, chunk] = row;
    if (!sourceId) continue;

    const existing = best.get(sourceId);
    if (existing && existing.score >= score) continue;

    const { title, snippet } = splitChunk(chunk);
    best.set(sourceId, {
      sourceId,
      score,
      title,
      snippet,
      slug: slugFromSource(sourceId),
    });
  }

  const hits = [...best.values()]
    .filter((hit) => hit.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, size);

  // Hits carry no slug when the index was built from Knowledge records. The
  // caller joins those to Contentful on `title` instead — the record ids in
  // this index belong to article versions that the migration swap archived,
  // so looking them up in Salesforce returns nothing.
  return hits;
};
