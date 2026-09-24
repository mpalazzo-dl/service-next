import { notFound, redirect } from "next/navigation";
import { draftMode } from "next/headers";

import {
  fetchArticleBySlug,
  fetchChildArticles,
  getTaxonomy,
  joinConcepts,
} from "@aces/contentful";
import { ArticleFeatures, EnableArticles, buildMetadata } from "@aces/features";
import {
  ArticleBreadcrumbs,
  ArticleFeedback,
  ArticleLiveFields,
  ArticleList,
  ArticleToc,
  ChildArticles,
} from "@aces/features";
import { CfRichTextRender } from "@aces/cf";
import { CatchAllPageProps } from "@aces/types";
import { buildArticlePath } from "@aces/utils";
import { Box, Chip, Col, Container, FlexBox, H1, Row, Text } from "@aces/ui";

interface ArticlePageProps {
  params: Promise<CatchAllPageProps>;
}

/**
 * Slugs are globally unique, so the article is resolved from the last segment
 * and the preceding segments are then validated against its `parentArticle`
 * chain. A URL that does not match the canonical path redirects rather than
 * rendering, which keeps one article from being reachable at many URLs.
 */
const resolveArticle = async (slug: string[], preview: boolean, lang: string) => {
  const leaf = slug[slug.length - 1];
  if (!leaf) return null;

  const article = await fetchArticleBySlug(leaf, preview, lang);
  if (!article) return null;

  const canonical = buildArticlePath(article);
  const requested = `/articles/${slug.join("/")}`;

  return { article, canonical, requested };
};

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug, lang } = await params;
  const { isEnabled } = await draftMode();

  const resolved = await resolveArticle(slug, isEnabled, lang);
  if (!resolved) return {};

  return buildMetadata(resolved.article.seo, {});
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug, lang } = await params;
  const { isEnabled } = await draftMode();

  if (!EnableArticles) {
    notFound();
  }

  const resolved = await resolveArticle(slug, isEnabled, lang);

  if (!resolved) {
    notFound();
  }

  const { article, canonical, requested } = resolved;

  if (canonical !== requested) {
    redirect(canonical);
  }

  const [taxonomy, children] = await Promise.all([
    getTaxonomy(isEnabled, lang),
    fetchChildArticles(article.sys.id, isEnabled, lang),
  ]);

  const concepts = joinConcepts(article, taxonomy);
  const related = article.relatedArticlesCollection?.items ?? [];

  return (
    <Container>
      <Row spacing={6} flexDirection={{ xs: "column", md: "row" }}>
        <Col size={{ xs: 12, md: 8 }}>
          <Box paddingY={6}>
            <ArticleBreadcrumbs article={article} />

            {/* In draft mode the article's own fields are handed to a client
                island so the editor's changes appear as they are typed. The
                rest of the page stays server-rendered either way. */}
            {isEnabled ? (
              <ArticleLiveFields
                article={article}
                concepts={concepts}
                lang={lang}
              />
            ) : (
              <>
                <FlexBox gap={2} alignItems="center" marginTop={4}>
                  {article.recordType && (
                    <Chip
                      label={article.recordType}
                      size="small"
                      uppercase={false}
                    />
                  )}
                  {concepts.map((concept) => (
                    <Chip
                      key={concept.id}
                      label={concept.label}
                      size="small"
                      uppercase={false}
                    />
                  ))}
                </FlexBox>

                <H1 marginTop={4}>{article.title}</H1>

                {article.summary && (
                  <Text marginTop={3} color="text.secondary">
                    {article.summary}
                  </Text>
                )}

                <Box marginTop={6}>
                  <CfRichTextRender
                    richTextDocument={article.bodyCopy.json}
                    lang={lang}
                    preview={isEnabled}
                    enableMaxTextWidth
                  />
                </Box>
              </>
            )}

            {ArticleFeatures.ShowArticleFeedback && (
              <ArticleFeedback
                entryId={article.sys.id}
                initialCounts={article.articleFeedback}
              />
            )}

            <ChildArticles articles={children.items} />

            {related.length > 0 && (
              <Box marginTop={8}>
                <Text fontWeight={600} marginBottom={4}>
                  Related articles
                </Text>
                <ArticleList articles={related} taxonomy={taxonomy} />
              </Box>
            )}
          </Box>
        </Col>

        <Col size={{ xs: 12, md: 4 }}>
          {ArticleFeatures.ShowTableOfContents && (
            <Box
              paddingY={6}
              style={{ position: "sticky", top: 96, alignSelf: "flex-start" }}
            >
              <ArticleToc bodyCopy={article.bodyCopy} />
            </Box>
          )}
        </Col>
      </Row>
    </Container>
  );
}
