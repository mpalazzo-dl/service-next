import NextLink from "next/link";

import { buildArticlePath } from "@aces/utils";
import { palette } from "@aces/theme";
import { Box, FlexBox, Icon, Text } from "@aces/ui";

export interface SearchResultRowProps {
  title: string;
  snippet: string;
  score: number;
  /** Null when the index returned something this site does not publish. */
  article: {
    title: string;
    slug: string;
    summary?: string;
    recordType?: string;
    parentArticle?: { slug: string; parentArticle?: { slug: string } | null } | null;
    __typename: "Article";
  } | null;
  showScore?: boolean;
}

/**
 * One search result.
 *
 * When the hit resolved to a Contentful article the row links to it and shows
 * the live title and summary. When it did not, the indexed chunk's own text is
 * shown instead — an unlinked result is more honest than silently dropping a
 * relevant answer.
 */
export const SearchResultRow = ({
  title,
  snippet,
  score,
  article,
  showScore = false,
}: SearchResultRowProps) => {
  const heading = article?.title ?? title;
  const body = article?.summary ?? snippet;

  const content = (
    <FlexBox alignItems="flex-start" justifyContent="space-between" gap={4}>
      <Box style={{ flex: 1 }}>
        <Text
          component="h3"
          style={{
            fontSize: "16px",
            fontWeight: 600,
            lineHeight: 1.45,
            color: article ? palette.primary.main : palette.text.primary,
          }}
        >
          {heading}
        </Text>

        {body && (
          <Text.Small
            color={palette.text.secondary}
            marginTop={2}
            style={{ lineHeight: 1.6 }}
          >
            {body}
          </Text.Small>
        )}

        <FlexBox alignItems="center" flexWrap="wrap" gap={2} marginTop={3}>
          {article?.recordType && (
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
          {showScore && (
            <Text.Small color={palette.text.secondary}>
              {Math.round(score * 100)}% match
            </Text.Small>
          )}
          {!article && (
            <Text.Small color={palette.text.secondary}>
              Not published on this site
            </Text.Small>
          )}
        </FlexBox>
      </Box>

      {article && (
        <Box paddingTop={1} style={{ flexShrink: 0 }}>
          <Icon
            icon="ChevronRight"
            size={18}
            color={palette.grey[600]}
            aria-hidden
          />
        </Box>
      )}
    </FlexBox>
  );

  return (
    <Box
      component="article"
      paddingY={5}
      style={{ borderBottom: `1px solid ${palette.border.light}` }}
    >
      {article ? (
        <NextLink
          href={buildArticlePath({ ...article, __typename: "Article" })}
          style={{ textDecoration: "none", display: "block" }}
        >
          {content}
        </NextLink>
      ) : (
        content
      )}
    </Box>
  );
};
