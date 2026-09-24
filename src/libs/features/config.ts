// Enable/Disable Features

export const EnableArticles = true;

export const EnableSearch = true;

/**
 * Sally, the knowledge assistant in the global wrapper.
 * Retrieval-only: she surfaces published articles and never generates prose.
 */
export const EnableSallyAssistant = true;

export const PaginationUrlParam = "page";

/**
 * Concept schemes that drive Knowledge Base browse and filtering.
 *
 * One facet group is rendered per scheme, so adding a second dimension
 * (audience, content format) is a config change rather than a code change.
 *
 * Leave empty to fall back to every scheme in the organization — convenient
 * while a taxonomy is still being authored, but unrelated org-level schemes
 * then leak into the filter sidebar, so keep it pinned.
 *
 * Must stay in step with the scheme bound to `article` in Contentful
 * (Content model -> Article -> Taxonomy).
 */
export const KnowledgeTaxonomySchemes: string[] = ["cs-zoominfo-products"];

/**
 * How deep `parentArticle` nesting is followed when building URLs, breadcrumbs
 * and the sidebar tree. GraphQL has no recursion, so this is also the depth
 * baked into the parent-chain selection set — raising it means editing the
 * query too.
 */
export const ArticleTreeMaxDepth = 3;

type FilterTypes = "select" | "toggle" | false;

interface ArticleFeaturesType {
  /** Taxonomy facet sidebar on the listing page. */
  ShowTaxonomyFilters: boolean;
  /** FAQ / How To / Technical Doc / Troubleshooting pills. */
  ShowRecordTypeFilter: boolean;
  ShowFilters: FilterTypes;
  ShowSort: boolean;
  ShowListingTitle: boolean;
  ShowDisplayTypes: boolean;
  ShowSocialShare: boolean;
  /** Concept chips on article cards and article detail. */
  ShowConceptTags: boolean;
  /** Sticky article-tree navigation on the detail page. */
  ShowArticleSidebar: boolean;
  /** Right-hand table of contents built from the body's headings. */
  ShowTableOfContents: boolean;
  /** Thumbs up/down widget. Requires a management token at runtime. */
  ShowArticleFeedback: boolean;
}

export const ArticleFeatures: ArticleFeaturesType = {
  ShowTaxonomyFilters: true,
  ShowRecordTypeFilter: true,
  ShowFilters: "toggle",
  ShowSort: false,
  ShowListingTitle: true,
  ShowDisplayTypes: true,
  ShowSocialShare: true,
  ShowConceptTags: true,
  ShowArticleSidebar: true,
  ShowTableOfContents: true,
  ShowArticleFeedback: true,
};

/**
 * Article record types, mirroring Salesforce Knowledge record types.
 * Must stay in sync with the `in` validation on `article.recordType`.
 */
export const ArticleRecordTypes = [
  "FAQ",
  "How To",
  "Technical Doc",
  "Troubleshooting",
] as const;

/**
 * Channel visibility, mirroring Salesforce Knowledge channels. Only articles in
 * `PublicChannels` are served by the public site — enforced in the query, not
 * just at render, so restricted content never reaches a collection response.
 */
export const ChannelVisibilityOptions = [
  "Public",
  "Customer",
  "Partner",
  "Internal",
] as const;

export const PublicChannels: string[] = ["Public"];
