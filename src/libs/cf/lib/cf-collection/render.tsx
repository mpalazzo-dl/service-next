import { CfBaseComponent } from "@aces/types";
import { generateId } from "@aces/utils";
import { componentSpacing } from "@aces/theme";
import { Box, Col, Container, Row } from "@aces/ui";

import { CfCard, CfCardProps } from "../cf-card/render";

export type CollectionDisplay = "Two Column" | "Three Column" | "Four Column";

export interface CfCollectionProps extends CfBaseComponent {
  display: CollectionDisplay;
  itemsCollection?: {
    items: CfCardProps[];
  };
}

/** MUI's 12-column grid divides cleanly by 2, 3 and 4. */
const COLUMN_SIZES: Record<CollectionDisplay, number> = {
  "Two Column": 6,
  "Three Column": 4,
  "Four Column": 3,
};

export const CfCollection = ({
  internalTitle,
  display = "Three Column",
  itemsCollection,
  __typename,
  id,
  lang,
  preview,
}: CfCollectionProps) => {
  const items = itemsCollection?.items ?? [];
  if (!items.length) return null;

  const span = COLUMN_SIZES[display] ?? COLUMN_SIZES["Three Column"];

  return (
    <Box
      id={generateId(internalTitle)}
      data-component={__typename}
      marginY={{ xs: componentSpacing.xs, md: componentSpacing.md }}
    >
      <Container>
        <Row spacing={4} flexDirection={{ xs: "column", sm: "row" }}>
          {items.map((item) => (
            <Col key={item.sys?.id ?? item.internalTitle} size={{ xs: 12, sm: 6, md: span }}>
              <CfCard
                {...item}
                fullHeight={true}
                id={item.sys?.id ?? id}
                lang={lang}
                preview={preview}
              />
            </Col>
          ))}
        </Row>
      </Container>
    </Box>
  );
};
