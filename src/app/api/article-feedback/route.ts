import { NextResponse } from "next/server";

/**
 * Thumbs up/down for a Knowledge article.
 *
 * Writes straight back to the `articleFeedback` JSON field via the CMA and
 * republishes, so counts are visible both on the published site and to editors
 * in Contentful.
 *
 * Two consequences worth knowing:
 *  - Every vote creates an entry version and fires the Contentful publish
 *    webhook. Scope `/api/revalidate` to the affected article or voting will
 *    rebuild the whole site.
 *  - This endpoint writes to the CMS and is public. The browser-side guard is
 *    a convenience, not protection; put real rate limiting in front of it
 *    before this is exposed.
 */

const SPACE = process.env.NEXT_PUBLIC_CF_SPACE;
const ENVIRONMENT = process.env.NEXT_PUBLIC_CF_ENVIRONMENT;
// Server-only on purpose — never expose this through NEXT_PUBLIC_.
const MANAGEMENT_TOKEN = process.env.NEXT_CF_MANAGEMENT_TOKEN;

const CMA = `https://api.contentful.com/spaces/${SPACE}/environments/${ENVIRONMENT}`;

const MAX_ATTEMPTS = 5;

/**
 * Contentful answers 429 under concurrent writes as readily as it answers 409
 * for a stale version, and a dropped 429 loses the vote silently. Both are
 * retried; `X-Contentful-RateLimit-Reset` is honoured when present.
 */
const RETRY_STATUSES = new Set([409, 429]);

const retryDelay = (response: Response, attempt: number): number => {
  const reset = Number(response.headers.get("X-Contentful-RateLimit-Reset"));
  if (Number.isFinite(reset) && reset > 0) return reset * 1000;
  // Exponential with jitter, so retries from concurrent voters spread out.
  return 150 * 2 ** (attempt - 1) + Math.random() * 100;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Vote = "up" | "down";

interface FeedbackCounts {
  up: number;
  down: number;
}

const cma = (path: string, init: RequestInit = {}) =>
  fetch(`${CMA}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${MANAGEMENT_TOKEN}`,
      "Content-Type": "application/vnd.contentful.management.v1+json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

const readCounts = (raw: unknown, locale: string): FeedbackCounts => {
  const value = (raw as Record<string, unknown> | undefined)?.[locale];
  const counts = (value ?? {}) as Partial<FeedbackCounts>;

  return {
    up: Number.isFinite(counts.up) ? Number(counts.up) : 0,
    down: Number.isFinite(counts.down) ? Number(counts.down) : 0,
  };
};

export async function POST(request: Request) {
  if (!MANAGEMENT_TOKEN || !SPACE || !ENVIRONMENT) {
    return NextResponse.json(
      { error: "Contentful management credentials are not configured" },
      { status: 500 },
    );
  }

  let body: { entryId?: string; vote?: Vote };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { entryId, vote } = body;

  if (!entryId || (vote !== "up" && vote !== "down")) {
    return NextResponse.json(
      { error: "entryId and vote ('up' | 'down') are required" },
      { status: 400 },
    );
  }

  // Read-modify-write races on `sys.version`. Contentful rejects a stale write
  // with 409 rather than silently clobbering, so retry from a fresh read.
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const entryResponse = await cma(`/entries/${entryId}`);

    if (!entryResponse.ok) {
      if (RETRY_STATUSES.has(entryResponse.status) && attempt < MAX_ATTEMPTS) {
        await wait(retryDelay(entryResponse, attempt));
        continue;
      }
      return NextResponse.json(
        { error: `Could not read entry (${entryResponse.status})` },
        { status: entryResponse.status === 404 ? 404 : 502 },
      );
    }

    const entry = await entryResponse.json();
    const version = entry.sys.version;

    // `articleFeedback` is unlocalized, so Contentful still stores it under the
    // space's default locale key.
    const locale = Object.keys(entry.fields?.title ?? { "en-US": null })[0];
    const counts = readCounts(entry.fields?.articleFeedback, locale);
    const updated: FeedbackCounts = { ...counts, [vote]: counts[vote] + 1 };

    entry.fields = {
      ...entry.fields,
      articleFeedback: { [locale]: updated },
    };

    const putResponse = await cma(`/entries/${entryId}`, {
      method: "PUT",
      headers: { "X-Contentful-Version": String(version) },
      body: JSON.stringify({ fields: entry.fields }),
    });

    if (!putResponse.ok) {
      if (RETRY_STATUSES.has(putResponse.status) && attempt < MAX_ATTEMPTS) {
        await wait(retryDelay(putResponse, attempt));
        continue;
      }
      return NextResponse.json(
        { error: `Could not update entry (${putResponse.status})` },
        { status: putResponse.status === 409 ? 409 : 502 },
      );
    }

    const saved = await putResponse.json();

    let publishResponse = await cma(`/entries/${entryId}/published`, {
      method: "PUT",
      headers: { "X-Contentful-Version": String(saved.sys.version) },
    });

    // The write landed; only the publish is rate-limited. Worth a few retries
    // rather than reporting an unpublished count.
    for (let p = 1; p <= 3 && publishResponse.status === 429; p++) {
      await wait(retryDelay(publishResponse, p));
      publishResponse = await cma(`/entries/${entryId}/published`, {
        method: "PUT",
        headers: { "X-Contentful-Version": String(saved.sys.version) },
      });
    }

    if (!publishResponse.ok) {
      // The count is saved as a draft; it just is not live yet. Report it
      // rather than pretending the vote landed on the published article.
      return NextResponse.json(
        { ...updated, published: false },
        { status: 202 },
      );
    }

    return NextResponse.json({ ...updated, published: true });
  }

  return NextResponse.json({ error: "Could not record vote" }, { status: 500 });
}
