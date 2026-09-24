import NextLink from "next/link";

import { ArticleTarget, TaxonomyConcept } from "@aces/types";
import { buildArticlePath } from "@aces/utils";
import { palette } from "@aces/theme";
import { Box, FlexBox, Icon, Text } from "@aces/ui";

export interface KnowledgeArticleCard extends ArticleTarget {
  title: string;
  summary?: string;
  recordType?: string;
  sys?: { id: string };
}

interface ArticleCardProps {
  article: KnowledgeArticleCard;
  concepts?: TaxonomyConcept[];
  showConceptTags?: boolean;
}

/**
 * A row, not a card. Help-center results are scanned top-to-bottom for a
 * matching title — a grid of boxes makes that scan slower, not faster.
 */
export const ArticleCard = ({
  article,
  concepts = [],
  showConceptTags = true,
}: ArticleCardProps) => {
  return (
    <Box
      component="article"
      paddingY={5}
      style={{ borderBottom: `1px solid ${palette.border.light}` }}
    >
      <NextLink
        href={buildArticlePath(article)}
        style={{ textDecoration: "none", display: "block" }}
      >
        <FlexBox alignItems="flex-start" justifyContent="space-between" gap={4}>
          <Box style={{ flex: 1 }}>
            <Text
              component="h3"
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: palette.primary.main,
                lineHeight: 1.45,
              }}
            >
              {article.title}
            </Text>

            {article.summary && (
              <Text.Small
                color={palette.text.secondary}
                marginTop={2}
                style={{ lineHeight: 1.6 }}
              >
                {article.summary}
              </Text.Small>
            )}

            <FlexBox alignItems="center" flexWrap="wrap" gap={2} marginTop={3}>
              {article.recordType && (
                <Text
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: palette.text.secondary,
                    background: palette.grey[200],
                    border: `1px solid ${palette.border.light}`,
                    borderRadius: "3px",
                    padding: "2px 8px",
                  }}
                >
                  {article.recordType}
                </Text>
              )}
              {showConceptTags &&
                concepts.slice(0, 3).map((concept) => (
                  <Text
                    key={concept.id}
                    style={{
                      fontSize: "12px",
                      color: palette.text.secondary,
                    }}
                  >
                    {concept.label}
                  </Text>
                ))}
            </FlexBox>
          </Box>

          <Box paddingTop={1} style={{ flexShrink: 0 }}>
            <Icon
              icon="ChevronRight"
              size={18}
              color={palette.grey[600]}
              aria-hidden
            />
          </Box>
        </FlexBox>
      </NextLink>
    </Box>
  );
};
