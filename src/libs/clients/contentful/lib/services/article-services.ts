import { defaultLocale } from "@aces/i18n";

import { PublicChannels } from "../../../../features/config";
import { cfClient, cfPreviewClient } from "../client";
import {
  ArticleDetailQuery,
  ArticleListQuery,
  ArticlePathsQuery,
  ChildArticlesQuery,
  RootArticlesQuery,
} from "../queries/article-queries";

/**
 * Channel gating is applied in every query's `where` clause rather than at
 * render time: filtering in a component still ships restricted article bodies
 * in the API response.
 *
 * Preview mode widens to every channel so editors can proof internal articles.
 */
const channelsFor = (preview: boolean): string[] =>
  preview ? ["Public", "Customer", "Partner", "Internal"] : PublicChannels;

const clientFor = (preview: boolean) => (preview ? cfPreviewClient : cfClient);

export interface ArticleListOptions {
  /** Concept ids; matches articles tagged with these or any descendant. */
  concepts?: string[];
  recordTypes?: string[];
  limit?: number;
  skip?: number;
  order?: string[];
}

export const fetchArticles = async (
  {
    concepts = [],
    recordTypes = [],
    limit = 12,
    skip = 0,
    order = ["title_ASC"],
  }: ArticleListOptions = {},
  preview = false,
  locale: string = defaultLocale,
) => {
  // Composed here rather than inline in the query so an unselected facet is
  // omitted entirely instead of sent as an empty filter.
  const where: Record<string, unknown> = {
    channelVisibility_in: channelsFor(preview),
  };

  if (concepts.length) {
    where.contentfulMetadata = {
      concepts: { descendants: { id_contains_some: concepts } },
    };
  }

  if (recordTypes.length) {
    where.recordType_in = recordTypes;
  }

  try {
    const response = await clientFor(preview).query({
      query: ArticleListQuery,
      variables: { where, preview, locale, limit, skip, order },
    });

    return response.data.articleCollection;
  } catch (error) {
    console.error("Error fetching articles:", error);
    throw error;
  }
};

export const fetchArticleBySlug = async (
  slug: string,
  preview = false,
  locale: string = defaultLocale,
) => {
  try {
    const response = await clientFor(preview).query({
      query: ArticleDetailQuery,
      variables: { slug, preview, locale },
    });

    const article = response.data.articleCollection.items[0] ?? null;
    if (!article) return null;

    // A restricted article must 404 on the public site, not just render blank.
    if (!channelsFor(preview).includes(article.channelVisibility)) {
      return null;
    }

    return article;
  } catch (error) {
    console.error("Error fetching article:", error);
    throw error;
  }
};

export const fetchChildArticles = async (
  parentId: string,
  preview = false,
  locale: string = defaultLocale,
) => {
  try {
    const response = await clientFor(preview).query({
      query: ChildArticlesQuery,
      variables: {
        parentId,
        preview,
        locale,
        channels: channelsFor(preview),
      },
    });

    return response.data.articleCollection;
  } catch (error) {
    console.error("Error fetching child articles:", error);
    throw error;
  }
};

export const fetchRootArticles = async (
  preview = false,
  locale: string = defaultLocale,
) => {
  try {
    const response = await clientFor(preview).query({
      query: RootArticlesQuery,
      variables: { preview, locale, channels: channelsFor(preview) },
    });

    return response.data.articleCollection;
  } catch (error) {
    console.error("Error fetching root articles:", error);
    throw error;
  }
};

export const fetchArticlePaths = async (
  preview = false,
  locale: string = defaultLocale,
) => {
  try {
    const response = await clientFor(preview).query({
      query: ArticlePathsQuery,
      variables: { preview, locale, channels: channelsFor(preview) },
    });

    return response.data.articleCollection.items;
  } catch (error) {
    console.error("Error fetching article paths:", error);
    throw error;
  }
};
