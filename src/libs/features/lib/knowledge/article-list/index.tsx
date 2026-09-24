import { CfConceptRef, Taxonomy } from "@aces/types";
import { joinConcepts } from "@aces/contentful";
import { palette } from "@aces/theme";
import { Box, Text } from "@aces/ui";

import { ArticleCard, KnowledgeArticleCard } from "../article-card";

type ListedArticle = KnowledgeArticleCard & {
  contentfulMetadata?: { concepts?: (CfConceptRef | null)[] | null } | null;
};

interface ArticleListProps {
  articles: ListedArticle[];
  taxonomy: Taxonomy;
  emptyMessage?: string;
  showConceptTags?: boolean;
}

/**
 * Concept labels are joined here rather than in the query: GraphQL returns
 * concept ids only, so every row needs the dictionary lookup.
 */
export const ArticleList = ({
  articles,
  taxonomy,
  emptyMessage = "No articles found.",
  showConceptTags = true,
}: ArticleListProps) => {
  if (!articles?.length) {
    return (
      <Box
        paddingY={10}
        style={{
          border: `1px dashed ${palette.border.default}`,
          borderRadius: "4px",
          textAlign: "center",
        }}
      >
        <Text color={palette.text.secondary}>{emptyMessage}</Text>
      </Box>
    );
  }

  return (
    <Box style={{ borderTop: `1px solid ${palette.border.light}` }}>
      {articles.map((article) => (
        <ArticleCard
          key={article.sys?.id ?? article.slug}
          article={article}
          concepts={joinConcepts(article, taxonomy)}
          showConceptTags={showConceptTags}
        />
      ))}
    </Box>
  );
};
