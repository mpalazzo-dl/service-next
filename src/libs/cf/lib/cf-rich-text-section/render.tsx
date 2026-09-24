import { ContentfulLivePreview } from "@contentful/live-preview";

import {
  CfAlignment,
  CfBaseComponent,
  CfRichText,
  Nested,
  SmallPadding,
} from "@aces/types";
import { generateId } from "@aces/utils";
import { componentSpacing } from "@aces/theme";
import { Box, Container, FlexBox } from "@aces/ui";
import { CfRichTextRender } from "../cf-rich-text-render";

/**
 * The model trimmed this to `alignment` + `bodyCopy`. Container width,
 * background, border and spacing are no longer authorable — an article body is
 * one consistent measure, not a set of per-section styling knobs.
 */
export interface CfRichTextSectionProps
  extends CfBaseComponent,
    Nested,
    SmallPadding {
  alignment: CfAlignment;
  bodyCopy: CfRichText;
}

export const CfRichTextSection = ({
  internalTitle,
  alignment,
  bodyCopy,
  __typename,
  nested,
  smallPadding,
  id,
  lang,
  preview,
}: CfRichTextSectionProps) => {
  return (
    <Box
      id={generateId(internalTitle)}
      data-component={__typename}
      paddingY={nested ? 0 : componentSpacing.md}
      style={{ width: "100%" }}
    >
      <Container maxWidth={"md"} nested={nested} smallPadding={smallPadding}>
        <FlexBox flexDirection="column" marginX={"auto"}>
          <CfRichTextRender
            richTextDocument={bodyCopy.json}
            alignment={alignment}
            lang={lang}
            preview={preview}
            enableMaxTextWidth
            {...ContentfulLivePreview.getProps({
              entryId: id,
              fieldId: "bodyCopy",
              locale: lang,
            })}
          />
        </FlexBox>
      </Container>
    </Box>
  );
};
