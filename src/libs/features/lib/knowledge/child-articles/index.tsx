import NextLink from "next/link";

import { ArticleTarget } from "@aces/types";
import { buildArticlePath } from "@aces/utils";
import { palette } from "@aces/theme";
import { Box, FlexBox, H3, Text } from "@aces/ui";

interface ChildArticle extends ArticleTarget {
  title: string;
  summary?: string;
  recordType?: string;
  sys?: { id: string };
}

/**
 * Sub-articles nested under the current one. Rendered from an explicit
 * `parentArticle` query rather than `linkedFrom`, which would also pull in
 * articles that merely reference this one as "related".
 */
export const ChildArticles = ({
  articles,
  title = "In this section",
}: {
  articles: ChildArticle[];
  title?: string;
}) => {
  if (!articles?.length) return null;

  return (
    <Box component="section" marginY={8}>
      <H3 marginBottom={4}>{title}</H3>
      <FlexBox flexDirection="column" gap={3}>
        {articles.map((article) => (
          <NextLink
            key={article.sys?.id ?? article.slug}
            href={buildArticlePath(article)}
            style={{ textDecoration: "none" }}
          >
            <Box
              padding={4}
              borderRadius={1}
              style={{ border: `1px solid ${palette.grey[300]}` }}
            >
              <Text fontWeight={600} color={palette.text.primary}>
                {article.title}
              </Text>
              {article.summary && (
                <Text.Small color={palette.text.secondary}>
                  {article.summary}
                </Text.Small>
              )}
            </Box>
          </NextLink>
        ))}
      </FlexBox>
    </Box>
  );
};
