import { defaultLocale } from "@aces/i18n";

import { PublicChannels } from "../../../../features/config";
import { cfClient, cfPreviewClient } from "../client";
import { ArticlesBySlugQuery } from "../queries/article-queries";

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
