import { notFound } from "next/navigation";
import { draftMode } from "next/headers";

import {
  fetchArticles,
  fetchSpecialtyPageData,
  getTaxonomy,
  getTaxonomyFacets,
} from "@aces/contentful";
import {
  ArticleFeatures,
  ArticleList,
  ArticleListingConfig,
  ArticleRecordTypes,
  EnableArticles,
  KbHero,
  KnowledgePagination,
  PAGE_PARAM,
  TaxonomyFilters,
  buildMetadata,
} from "@aces/features";
import { getLocale } from "@aces/i18n";
import { PageProps, RouteDirectory, SpecialtyPages } from "@aces/types";
import { toSingleValueArray } from "@aces/utils";
import { palette } from "@aces/theme";
import { Box, Col, Container, H2, Row, Text } from "@aces/ui";

interface KnowledgeHomeProps {
  params: Promise<PageProps>;
  searchParams: Promise<{
    concepts?: string | string[];
    type?: string | string[];
    page?: string;
  }>;
}

export async function generateMetadata({ params }: KnowledgeHomeProps) {
  const { lang } = await params;
  const { isEnabled } = await draftMode();

  // SEO for the listing comes from the page entry flagged `Knowledge Home`,
  // so editors control it without a deploy.
  const page = await fetchSpecialtyPageData(
    SpecialtyPages.KnowledgeHome,
    isEnabled,
    lang,
  );

  const seo = page.pageResponse.data.pageCollection.items[0]?.seo;

  return seo ? buildMetadata(seo, {}) : {};
}

export default async function KnowledgeHome({
  params,
  searchParams,
}: KnowledgeHomeProps) {
  const { lang } = await params;
  const { isEnabled } = await draftMode();

  if (!EnableArticles) {
    notFound();
  }

  const resolved = await searchParams;
  const concepts = resolved?.concepts ? toSingleValueArray(resolved.concepts) : [];
  const recordTypes = resolved?.type ? toSingleValueArray(resolved.type) : [];
  const page = Math.max(Number(resolved?.[PAGE_PARAM] ?? 1) || 1, 1);

  const [taxonomy, facets, articles, t] = await Promise.all([
    getTaxonomy(isEnabled, lang),
    getTaxonomyFacets(isEnabled, lang),
    fetchArticles(
      {
        concepts,
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

  const isFiltered = concepts.length > 0 || recordTypes.length > 0;
  const count = articles.total;

  return (
    <>
      <KbHero
        title={t.knowledge?.title ?? "Knowledge Base"}
        subtitle="Search our guides, how-tos and troubleshooting articles, or narrow the list with the filters."
        placeholder={t.knowledge?.searchPlaceholder ?? "Search for answers"}
        popularLabel={t.knowledge?.popularSearches ?? "Popular searches"}
        popularSearches={["salesforce sync", "credits", "intent score", "chrome extension"]}
      />

      <Container maxWidth="lg">
        <Row spacing={10} flexDirection={{ xs: "column", md: "row" }}>
          <Col size={{ xs: 12, md: 3 }}>
            <Box paddingY={{ xs: 6, md: 10 }}>
              {ArticleFeatures.ShowTaxonomyFilters && (
                <TaxonomyFilters
                  facets={facets}
                  recordTypes={
                    ArticleFeatures.ShowRecordTypeFilter ? ArticleRecordTypes : []
                  }
                  recordTypeLabel={t.knowledge?.articleType ?? "Article type"}
                />
              )}
            </Box>
          </Col>

          <Col size={{ xs: 12, md: 9 }}>
            <Box paddingTop={{ xs: 0, md: 10 }} paddingBottom={12}>
              <Box
                paddingBottom={5}
                style={{ borderBottom: `1px solid ${palette.border.light}` }}
              >
                <H2>{isFiltered ? "Filtered articles" : "All articles"}</H2>
                <Text.Small color={palette.text.secondary} marginTop={1}>
                  {count} {count === 1 ? "article" : "articles"}
                </Text.Small>
              </Box>

              <Box marginTop={6}>
                <ArticleList
                  articles={articles.items}
                  taxonomy={taxonomy}
                  emptyMessage={t.postType?.noResults ?? "No articles found."}
                  showConceptTags={ArticleFeatures.ShowConceptTags}
                />

                <KnowledgePagination
                  page={page}
                  total={count}
                  perPage={ArticleListingConfig.ArticlesLimit}
                  basePath={RouteDirectory.Articles}
                  params={resolved}
                />
              </Box>
            </Box>
          </Col>
        </Row>
      </Container>
    </>
  );
}
