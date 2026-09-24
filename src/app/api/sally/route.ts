import { NextRequest, NextResponse } from "next/server";

import { searchArticlesInContentful } from "@aces/contentful";
import { buildArticlePath } from "@aces/utils";
// Imported by path: the search service is server-only and must not be pulled
// into a client bundle through the feature barrel.
import { searchKnowledge } from "@aces/features/lib/search/services";

/**
 * Sally — the knowledge-base assistant.
 *
 * Deliberately NOT a language model. Sally retrieves articles and wraps them
 * in a small set of scripted replies. Everything she says about an article
 * comes from that article's own title and summary, so she cannot invent an
 * answer or cite a page that does not exist — which is the failure mode that
 * makes a support bot worse than a search box.
 *
 * Retrieval order:
 *   1. The Data 360 vector index, joined to Contentful (semantic, ranked).
 *   2. A direct Contentful keyword search, when the index returns nothing
 *      that resolves to a published article.
 */

export interface SallyArticle {
  title: string;
  summary?: string;
  path: string;
  recordType?: string;
}

export interface SallyReply {
  reply: string;
  articles: SallyArticle[];
  /** Which retrieval path answered, so the UI can be honest in a demo. */
  source: "index" | "contentful" | "none";
}

const MAX_ARTICLES = 3;

const toSallyArticle = (article: any): SallyArticle => ({
  title: article.title,
  summary: article.summary,
  recordType: article.recordType,
  path: buildArticlePath({ ...article, __typename: "Article" }),
});

/**
 * Words that carry no retrieval signal. A question like "How do I connect
 * Salesforce?" must not be matched literally — `title_contains` on the whole
 * sentence matches nothing. Searching the content words instead is what makes
 * a natural question work.
 */
const STOP_WORDS = new Set([
  "about", "after", "does", "doing", "from", "have", "how", "into", "some",
  "that", "the", "their", "them", "then", "there", "these", "they", "this",
  "what", "when", "where", "which", "why", "will", "with", "your",
  "can", "could", "should", "would", "and", "for", "are", "was", "were",
  "you", "get", "got", "let", "our", "out", "use", "using", "need", "want",
  "please", "help",
]);

const keywords = (question: string): string[] =>
  [
    ...new Set(
      question
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 3 && !STOP_WORDS.has(word)),
    ),
  ].slice(0, 4);

const openers = [
  "Here's what I found:",
  "These should help:",
  "I turned up a few things:",
];

const pick = (list: string[], seed: string) =>
  list[Math.abs([...seed].reduce((a, c) => a + c.charCodeAt(0), 0)) % list.length];

export async function POST(request: NextRequest) {
  let body: { message?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = body.message?.trim() ?? "";

  if (!message) {
    return NextResponse.json<SallyReply>({
      reply: "Ask me anything about ZoomInfo and I'll find the article for you.",
      articles: [],
      source: "none",
    });
  }

  let articles: SallyArticle[] = [];
  let source: SallyReply["source"] = "none";

  try {
    const { results } = await searchKnowledge(message, { limit: 8 });
    const resolved = results.filter((r) => r.article).slice(0, MAX_ARTICLES);

    if (resolved.length) {
      articles = resolved.map((r) => toSallyArticle(r.article));
      source = "index";
    }
  } catch (error) {
    console.error("Sally: index retrieval failed:", error);
  }

  if (!articles.length) {
    // Search each content word separately, then rank by how many of them an
    // article matched — a cheap stand-in for relevance that beats a single
    // literal match on the whole question.
    const terms = keywords(message);
    const searches = terms.length ? terms : [message];

    const perTerm = await Promise.all(
      searches.map((term) => searchArticlesInContentful(term, 6)),
    );

    const scored = new Map<string, { article: any; score: number }>();
    for (const batch of perTerm) {
      for (const article of batch) {
        const entry = scored.get(article.slug) ?? { article, score: 0 };
        entry.score += 1;
        scored.set(article.slug, entry);
      }
    }

    // A term in the title is worth more than the same term buried in the body:
    // "connect Salesforce" should reach the how-to before the troubleshooting
    // article that merely mentions connecting.
    for (const entry of scored.values()) {
      const title = String(entry.article.title ?? "").toLowerCase();
      for (const term of searches) {
        if (title.includes(term)) entry.score += 2;
      }
    }

    const ranked = [...scored.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_ARTICLES);

    if (ranked.length) {
      articles = ranked.map((r) => toSallyArticle(r.article));
      source = "contentful";
    }
  }

  if (!articles.length) {
    return NextResponse.json<SallyReply>({
      reply:
        "I couldn't find an article for that. Try naming the product area — " +
        "Intent, Copilot, Integrations, Enrich — or browse the topics from the " +
        "home page.",
      articles: [],
      source: "none",
    });
  }

  return NextResponse.json<SallyReply>({
    reply: pick(openers, message),
    articles,
    source,
  });
}
