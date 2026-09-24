import { defaultLocale } from "@aces/i18n";

import { PublicChannels } from "../../../../features/config";
import { cfClient, cfPreviewClient } from "../client";
import {
  ArticleFallbackSearchQuery,
  ArticlesBySlugQuery,
} from "../queries/article-queries";

/**
 * Resolves search hits to published articles.
 *
 * Search ranking comes from the Salesforce Data 360 index; the article body,
 * title and URL come from Contentful, which stays the source of truth. This
 * function is the join between the two.
 */
export const fetchArticlesBySlugs = async (
  slugs: string[],
  titles: string[] = [],
  preview = false,
  locale: string = defaultLocale,
) => {
  if (!slugs.length && !titles.length) return [];

  const client = preview ? cfPreviewClient : cfClient;
  const channels = preview
    ? ["Public", "Customer", "Partner", "Internal"]
    : PublicChannels;

  try {
    const response = await client.query({
      query: ArticlesBySlugQuery,
      variables: { slugs, titles, channels, preview, locale },
    });

    return response.data.articleCollection.items;
  } catch (error) {
    console.error("Error resolving search hits to articles:", error);
    return [];
  }
};

/**
 * Keyword search straight against Contentful.
 *
 * Only used when the index cannot resolve a hit to a published article. The
 * Data 360 index remains the primary ranker.
 */
export const searchArticlesInContentful = async (
  query: string,
  limit = 3,
  preview = false,
  locale: string = defaultLocale,
) => {
  if (!query.trim()) return [];

  const client = preview ? cfPreviewClient : cfClient;
  const channels = preview
    ? ["Public", "Customer", "Partner", "Internal"]
    : PublicChannels;

  try {
    const response = await client.query({
      query: ArticleFallbackSearchQuery,
      variables: {
        query: query.trim().toLowerCase(),
        channels,
        preview,
        locale,
        limit,
      },
    });

    return response.data.articleCollection.items;
  } catch (error) {
    console.error("Contentful fallback search failed:", error);
    return [];
  }
};
