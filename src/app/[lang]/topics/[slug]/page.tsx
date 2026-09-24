import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import NextLink from "next/link";

import {
  conceptSlug,
  fetchArticles,
  findConceptBySlug,
  getTaxonomy,
} from "@aces/contentful";
import {
  ArticleFeatures,
  ArticleList,
  ArticleListingConfig,
  ArticleRecordTypes,
  EnableArticles,
  KnowledgePagination,
  PAGE_PARAM,
  TaxonomyFilters,
  buildMetadata,
} from "@aces/features";
import { getLocale } from "@aces/i18n";
import { RouteDirectory } from "@aces/types";
import { toSingleValueArray } from "@aces/utils";
import { palette } from "@aces/theme";
import {
  Box,
  Breadcrumbs,
  Col,
  Container,
  FlexBox,
  H1,
  Row,
  Text,
} from "@aces/ui";

interface TopicPageProps {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<{ type?: string | string[]; page?: string }>;
}

/**
 * Category listing for one taxonomy concept.
 *
 * A concept's child concepts are included via the index's `descendants`
 * filter, so a parent category shows everything beneath it without the page
 * having to walk the tree.
 */
/**
 * Concept definitions are often migration provenance ("[Managed]",
 * "Salesforce Knowledge data category Products > Invoices") rather than
 * anything a customer should read. Only show one that looks authored.
 */
const isCustomerFacing = (definition?: string): definition is string => {
  if (!definition) return false;
  return !/^\[|data category|knowledge article/i.test(definition.trim());
};

const loadTopic = async (slug: string, preview: boolean, lang: string) => {
  const taxonomy = await getTaxonomy(preview, lang);
  const concept = findConceptBySlug(taxonomy, slug);

  return { taxonomy, concept };
};

export async function generateMetadata({ params }: TopicPageProps) {
  const { slug, lang } = await params;
  const { isEnabled } = await draftMode();
  const { concept } = await loadTopic(slug, isEnabled, lang);

  if (!concept) return {};

  return await buildMetadata(
    {
      title: concept.label,
      description: isCustomerFacing(concept.definition)
        ? concept.definition
        : `Help articles about ${concept.label.toLowerCase()}.`,
    },
    {},
  );
}

export default async function TopicPage({
  params,
  searchParams,
}: TopicPageProps) {
  const { slug, lang } = await params;
  const { isEnabled } = await draftMode();

  if (!EnableArticles) {
    notFound();
  }

  const { taxonomy, concept } = await loadTopic(slug, isEnabled, lang);

  if (!concept) {
    notFound();
  }

  const resolved = await searchParams;
  const recordTypes = resolved?.type ? toSingleValueArray(resolved.type) : [];
  const page = Math.max(Number(resolved?.[PAGE_PARAM] ?? 1) || 1, 1);

  const [articles, t] = await Promise.all([
    fetchArticles(
      {
        concepts: [concept.id],
        recordTypes,
        limit: ArticleListingConfig.ArticlesLimit,
        skip: (page - 1) * ArticleListingConfig.ArticlesLimit,
        order: [ArticleListingConfig.DefaultOrder],
      },
      isEnabled,
      lang,
    ),
    getLocale(lang, "common"),
  ]);

  // An out-of-range page should not render an empty list: that is an endless
  // supply of crawlable empty pages, and a dead end for anyone who edits the
  // URL. Page 1 stays valid so a genuinely empty filter still shows its
  // "no articles" message.
  if (page > 1 && !articles.items.length) {
    notFound();
  }

  const children = (taxonomy.childrenByParent[concept.id] ?? [])
    .map((id) => taxonomy.conceptsById[id])
    .filter(Boolean);

  return (
    <Container maxWidth="lg">
      <Box marginTop={8}>
        <Breadcrumbs aria-label="breadcrumb">
          <NextLink href={RouteDirectory.Homepage}>
            {t.breadcrumbs?.home ?? "Home"}
          </NextLink>
          <NextLink href={RouteDirectory.Articles}>
            {t.knowledge?.title ?? "Knowledge Base"}
          </NextLink>
          <Text component="span" aria-current="page">
            {concept.label}
          </Text>
        </Breadcrumbs>
      </Box>

      <Box marginTop={6}>
        <H1>{concept.label}</H1>
        {isCustomerFacing(concept.definition) && (
          <Text marginTop={2} color={palette.text.secondary}>
            {concept.definition}
          </Text>
        )}
        <Text.Small color={palette.text.secondary} marginTop={2}>
          {articles.total} {articles.total === 1 ? "article" : "articles"}
        </Text.Small>
      </Box>

      {children.length > 0 && (
        <FlexBox flexWrap="wrap" gap={2} marginTop={5}>
          {children.map((child) => (
            <NextLink
              key={child.id}
              href={`${RouteDirectory.Topics}/${conceptSlug(child)}`}
              style={{
                fontSize: "13px",
                padding: "5px 12px",
                borderRadius: "999px",
                border: `1px solid ${palette.border.default}`,
                color: palette.text.primary,
              }}
            >
              {child.label}
            </NextLink>
          ))}
        </FlexBox>
      )}

      <Row spacing={10} marginTop={8} flexDirection={{ xs: "column", md: "row" }}>
        <Col size={{ xs: 12, md: 3 }}>
          {ArticleFeatures.ShowRecordTypeFilter && (
            <Box paddingBottom={6}>
              <TaxonomyFilters
                facets={[]}
                recordTypes={ArticleRecordTypes}
                recordTypeLabel={t.knowledge?.articleType ?? "Article type"}
              />
            </Box>
          )}
        </Col>

        <Col size={{ xs: 12, md: 9 }}>
          <Box paddingBottom={12}>
            <ArticleList
              articles={articles.items}
              taxonomy={taxonomy}
              emptyMessage={t.postType?.noResults ?? "No articles found."}
              showConceptTags={ArticleFeatures.ShowConceptTags}
            />

            <KnowledgePagination
              page={page}
              total={articles.total}
              perPage={ArticleListingConfig.ArticlesLimit}
              basePath={`${RouteDirectory.Topics}/${slug}`}
              params={resolved}
            />
          </Box>
        </Col>
      </Row>
    </Container>
  );
}
