import "server-only";

import { fetchArticlesBySlugs, getTaxonomy, joinConcepts } from "@aces/contentful";
import { defaultLocale, Locale } from "@aces/i18n";
import {
  isSearchConfigured,
  searchKnowledgeIndex,
  type SearchHit,
} from "@aces/salesforce";

import { SearchConfig } from "./config";

/**
 * A search result, after the Data 360 hit has been joined to Contentful.
 *
 * `article` is null when the index returns something this site does not
 * publish — today the index is built from Salesforce Knowledge records, whose
 * ids carry no slug, so most hits land here. Those still render (title and
 * snippet come from the indexed chunk) but cannot link anywhere.
 */
export interface KnowledgeSearchResult {
  sourceId: string;
  score: number;
  title: string;
  snippet: string;
  article: any | null;
  /** Concepts on the resolved article, joined from the taxonomy dictionary. */
  concepts: { id: string; label: string }[];
}

export interface KnowledgeSearchResponse {
  results: KnowledgeSearchResult[];
  /** Concept counts across the unfiltered result set, for the facet list. */
  facets: { id: string; label: string; count: number }[];
  total: number;
  /** False when the Salesforce org is not configured. */
  configured: boolean;
  /** True when the index answered but nothing cleared the score threshold. */
  searched: boolean;
}

/** Titles round-trip through Salesforce and Contentful, so compare loosely. */
const normalize = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const EMPTY: KnowledgeSearchResponse = {
  results: [],
  facets: [],
  total: 0,
  configured: true,
  searched: false,
};

/**
 * Ranking comes from Salesforce, content comes from Contentful.
 *
 * The two are joined on slug, so a hit only becomes a linked article when the
 * index and the space hold the same corpus.
 */
export const searchKnowledge = async (
  query: string,
  {
    limit = SearchConfig.ListingLimit,
    minScore = SearchConfig.MinScore,
    preview = false,
    locale = defaultLocale,
    concepts: conceptFilter = [],
  }: {
    limit?: number;
    minScore?: number;
    preview?: boolean;
    locale?: Locale;
    /** Concept ids to narrow results to. Empty means no topic filter. */
    concepts?: string[];
  } = {},
): Promise<KnowledgeSearchResponse> => {
  // Reported separately from "no matches" so the page can say the org is
  // missing rather than implying the query found nothing.
  if (!isSearchConfigured()) {
    return { ...EMPTY, configured: false };
  }

  if (!query.trim()) return EMPTY;

  let hits: SearchHit[];

  try {
    hits = await searchKnowledgeIndex(query, { limit, minScore });
  } catch (error) {
    console.error("Knowledge search failed:", error);
    return { ...EMPTY, searched: true };
  }

  if (!hits.length) {
    return { results: [], facets: [], total: 0, configured: true, searched: true };
  }

  const slugs = hits
    .map((hit) => hit.slug)
    .filter((slug): slug is string => Boolean(slug));
  const titles = hits.map((hit) => hit.title).filter(Boolean);

  const [articles, taxonomy] = await Promise.all([
    fetchArticlesBySlugs(slugs, titles, preview, locale),
    getTaxonomy(preview, locale),
  ]);

  const bySlug = new Map<string, any>(
    articles.map((article: any) => [article.slug, article]),
  );
  const byTitle = new Map<string, any>(
    articles.map((article: any) => [normalize(article.title), article]),
  );

  const all: KnowledgeSearchResult[] = hits.map((hit) => {
    // Slug first — it is the durable key once the sitemap index lands.
    const article =
      (hit.slug ? bySlug.get(hit.slug) : null) ??
      byTitle.get(normalize(hit.title)) ??
      null;

    return {
      sourceId: hit.sourceId,
      score: hit.score,
      title: hit.title,
      snippet: hit.snippet,
      article,
      concepts: article
        ? joinConcepts(article, taxonomy).map((c) => ({
            id: c.id,
            label: c.label,
          }))
        : [],
    };
  });

  // Facets are counted before filtering, so the counts do not collapse to the
  // one topic already selected.
  const counts = new Map<string, { id: string; label: string; count: number }>();
  for (const result of all) {
    for (const concept of result.concepts) {
      const entry = counts.get(concept.id) ?? { ...concept, count: 0 };
      entry.count += 1;
      counts.set(concept.id, entry);
    }
  }

  const results = conceptFilter.length
    ? all.filter((result) =>
        result.concepts.some((c) => conceptFilter.includes(c.id)),
      )
    : all;

  return {
    results,
    facets: [...counts.values()].sort((a, b) => b.count - a.count),
    total: results.length,
    configured: true,
    searched: true,
  };
};
