import NextLink from "next/link";

import { conceptSlug } from "@aces/contentful";
import { TaxonomyFacet } from "@aces/types";
import { RouteDirectory } from "@aces/types";
import { palette } from "@aces/theme";
import { Box, Col, FlexBox, H2, Icon, Row, Text } from "@aces/ui";

interface TaxonomyBrowseProps {
  facets: TaxonomyFacet[];
  title?: string;
  /** Only the first scheme is shown as tiles; the rest stay sidebar facets. */
  schemeId?: string;
}

/**
 * Category tiles — the browse path for people who do not know what to search
 * for. Each tile links to the listing pre-filtered to that concept, so browse
 * and filter are the same mechanism rather than two parallel ones.
 */
export const TaxonomyBrowse = ({
  facets,
  title = "Browse by topic",
  schemeId,
}: TaxonomyBrowseProps) => {
  const facet = schemeId
    ? facets.find((f) => f.scheme.id === schemeId)
    : facets[0];

  if (!facet || !facet.tree.length) return null;

  return (
    <Box component="section" paddingTop={12}>
      <H2>{title}</H2>

      <Row
        spacing={4}
        marginTop={6}
        marginBottom={14}
        flexDirection={{ xs: "column", sm: "row" }}
      >
        {facet.tree.map((concept) => (
          <Col key={concept.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <NextLink
              href={`${RouteDirectory.Topics}/${conceptSlug(concept)}`}
              style={{
                textDecoration: "none",
                display: "block",
                height: "100%",
              }}
            >
              <FlexBox
                alignItems="center"
                justifyContent="space-between"
                gap={3}
                padding={5}
                style={{
                  border: `1px solid ${palette.border.default}`,
                  borderRadius: "4px",
                  height: "100%",
                  background: palette.common.white,
                  transition: "border-color 120ms ease, background 120ms ease",
                }}
              >
                <Box>
                  <Text
                    style={{ fontWeight: 600, color: palette.text.primary }}
                  >
                    {concept.label}
                  </Text>
                  {concept.children.length > 0 && (
                    <Text.Small color={palette.text.secondary} marginTop={1}>
                      {concept.children.length}{" "}
                      {concept.children.length === 1 ? "topic" : "topics"}
                    </Text.Small>
                  )}
                </Box>
                <Icon
                  icon="ChevronRight"
                  size={18}
                  color={palette.grey[600]}
                  aria-hidden
                />
              </FlexBox>
            </NextLink>
          </Col>
        ))}
      </Row>
    </Box>
  );
};
