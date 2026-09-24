import { ContentfulLivePreview } from "@contentful/live-preview";

import { CfBaseComponent, Nested } from "@aces/types";
import { generateId } from "@aces/utils";
import { componentSpacing } from "@aces/theme";
import { Box, Container } from "@aces/ui";

import style from "./style.module.css";

export interface CfCodeEmbedProps extends CfBaseComponent, Nested {
  code: string;
}

/**
 * The model renames this field to `code` and types it as plain text — it is a
 * snippet, not an HTML embed. Rendering it as escaped text in a <pre> keeps
 * newlines and indentation intact and removes a `dangerouslySetInnerHTML`
 * that would have executed anything an author pasted in.
 */
export const CfCodeEmbed = ({
  internalTitle,
  code,
  nested,
  __typename,
  id,
  lang,
}: CfCodeEmbedProps) => {
  return (
    <Box
      id={generateId(internalTitle)}
      data-component={__typename}
      marginY={{
        xs: !nested ? componentSpacing.xs : "",
        md: !nested ? componentSpacing.md : "",
      }}
    >
      <Container nested={nested}>
        <pre
          className={style.embed}
          {...ContentfulLivePreview.getProps({
            entryId: id,
            fieldId: "code",
            locale: lang,
          })}
        >
          <code>{code}</code>
        </pre>
      </Container>
    </Box>
  );
};
