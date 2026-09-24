import { gql } from "@apollo/client";

import { MetadataFragment } from "./page-queries";

/**
 * `channelVisibility` mirrors Salesforce Knowledge channels. Restricted
 * articles are excluded in the `where` clause, never just hidden at render —
 * filtering in the component still ships the content in the API response.
 */

/** Card-level fields. Deliberately small: listings fetch many of these. */
export const ArticleCardFragment = gql`
  fragment ArticleCard on Article {
    __typename
    title
    slug
    summary
    publishDate
    recordType
    channelVisibility
    parentArticle {
      slug
      parentArticle {
        slug
      }
    }
    contentfulMetadata {
      concepts {
        id
      }
    }
    sys {
      id
    }
  }
`;

/**
 * The parent chain is a fixed-depth selection set — GraphQL has no recursive
 * fragments. Depth must match `ArticleTreeMaxDepth` in the feature config.
 */
export const ArticleDetailQuery = gql`
  ${ArticleCardFragment}
  ${MetadataFragment}

  query ($slug: String!, $preview: Boolean!, $locale: String!) {
    articleCollection(
      where: { slug: $slug }
      limit: 1
      preview: $preview
      locale: $locale
    ) {
      items {
        ...ArticleCard
        keywords
        articleFeedback
        bodyCopy {
          json
        }
        relatedArticlesCollection(limit: 4) {
          items {
            ...ArticleCard
          }
        }
        seo {
          ...Metadata
        }
      }
    }
  }
`;

export const ArticleListQuery = gql`
  ${ArticleCardFragment}

  query (
    $where: ArticleFilter
    $preview: Boolean!
    $locale: String!
    $limit: Int!
    $skip: Int!
    $order: [ArticleOrder]
  ) {
    articleCollection(
      where: $where
      limit: $limit
      skip: $skip
      order: $order
      preview: $preview
      locale: $locale
    ) {
      total
      items {
        ...ArticleCard
      }
    }
  }
`;

/**
 * Direct Contentful keyword search, used as a retrieval fallback.
 *
 * The Data 360 index is the primary ranker, but it only helps when the index
 * and the space hold the same corpus. When a hit cannot be resolved to a
 * published article — today, because the index is built from a different
 * corpus — this keeps the assistant useful by searching the space directly.
 * `bodyCopy_contains` matches the article's own rich text, though not text
 * inside embedded entries.
 */
export const ArticleFallbackSearchQuery = gql`
  ${ArticleCardFragment}

  query (
    $query: String!
    $channels: [String]!
    $preview: Boolean!
    $locale: String!
    $limit: Int!
  ) {
    articleCollection(
      where: {
        channelVisibility_in: $channels
        OR: [
          { title_contains: $query }
          { summary_contains: $query }
          { bodyCopy_contains: $query }
          { keywords_contains_some: [$query] }
        ]
      }
      limit: $limit
      preview: $preview
      locale: $locale
    ) {
      total
      items {
        ...ArticleCard
      }
    }
  }
`;

/**
 * Resolves a batch of search hits to published articles, by slug or by title.
 *
 * Title is the working key while the index is built from Knowledge records,
 * whose ids no longer resolve; slug takes over once the index is built from
 * this site's sitemap. Relevance ranking is the search index's job — this only
 * rehydrates the hits, and order here is meaningless.
 */
export const ArticlesBySlugQuery = gql`
  ${ArticleCardFragment}

  query (
    $slugs: [String]!
    $titles: [String]!
    $channels: [String]!
    $preview: Boolean!
    $locale: String!
  ) {
    articleCollection(
      where: {
        channelVisibility_in: $channels
        OR: [{ slug_in: $slugs }, { title_in: $titles }]
      }
      limit: 50
      preview: $preview
      locale: $locale
    ) {
      total
      items {
        ...ArticleCard
      }
    }
  }
`;

/**
 * Children of one article.
 *
 * Deliberately not `linkedFrom`: that would also return articles that merely
 * reference this one through `relatedArticles`.
 */
export const ChildArticlesQuery = gql`
  ${ArticleCardFragment}

  query (
    $parentId: String!
    $preview: Boolean!
    $locale: String!
    $channels: [String]!
  ) {
    articleCollection(
      where: {
        parentArticle: { sys: { id: $parentId } }
        channelVisibility_in: $channels
      }
      limit: 50
      order: [title_ASC]
      preview: $preview
      locale: $locale
    ) {
      total
      items {
        ...ArticleCard
      }
    }
  }
`;

/** Top-level articles — the roots of the sidebar tree. */
export const RootArticlesQuery = gql`
  ${ArticleCardFragment}

  query ($preview: Boolean!, $locale: String!, $channels: [String]!) {
    articleCollection(
      where: {
        parentArticle_exists: false
        channelVisibility_in: $channels
      }
      limit: 50
      order: [title_ASC]
      preview: $preview
      locale: $locale
    ) {
      total
      items {
        ...ArticleCard
      }
    }
  }
`;

/** Slug + parent chain for every article — used by generateStaticParams. */
export const ArticlePathsQuery = gql`
  query ($preview: Boolean!, $locale: String!, $channels: [String]!) {
    articleCollection(
      where: { channelVisibility_in: $channels }
      limit: 500
      preview: $preview
      locale: $locale
    ) {
      items {
        slug
        parentArticle {
          slug
          parentArticle {
            slug
          }
        }
      }
    }
  }
`;
