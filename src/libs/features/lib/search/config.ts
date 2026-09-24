export const GlobalSearchQuery = "q";

/**
 * Topic (taxonomy concept) filter on the search page.
 *
 * Declared here, not in the client component that renders the filter: a
 * constant exported from a `"use client"` module arrives at a Server Component
 * as a client reference rather than its value, so the lookup silently misses.
 */
export const SEARCH_CONCEPTS_PARAM = "topic";

export const SearchConfig = {
  /** Hits shown in the header drawer's quick results. */
  TopResultsLimits: 5,
  /** Hits shown on the full search page. */
  ListingLimit: 10,
  /**
   * Drop weak vector matches. The index returns a cosine score, and anything
   * below roughly this is a different topic that happens to share vocabulary.
   */
  MinScore: 0.75,
} as const;
