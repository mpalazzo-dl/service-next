import { ContentfulLivePreview } from "@contentful/live-preview";

import { CfBaseComponent, CfImageProps, CfRichText } from "@aces/types";
import { generateId } from "@aces/utils";
import { Card, FlexBox } from "@aces/ui";

import { CfButton, CfButtonProps } from "../cf-button/render";
import { CfImage } from "../cf-image/render";
import { CfRichTextRender } from "../cf-rich-text-render";

export interface CfCardProps extends CfBaseComponent {
  image?: CfImageProps;
  cardBody: CfRichText;
  buttonsCollection?: {
    items: CfButtonProps[];
  };
  fullHeight?: boolean;
}

export const CfCard = ({
  internalTitle,
  image,
  cardBody,
  buttonsCollection,
  fullHeight,
  __typename,
  id,
  lang,
  preview,
}: CfCardProps) => {
  const buttons = buttonsCollection?.items ?? [];

  return (
    <Card
      id={generateId(internalTitle)}
      data-component={__typename}
      raised={false}
      fullHeight={fullHeight}
    >
      {image && (
        <CfImage
          {...image}
          nested={true}
          // Cards sit in a grid, so their media needs a predictable height.
          responsive={false}
          maxHeight={160}
          id={image.sys?.id ?? id}
          lang={lang}
          preview={preview}
        />
      )}

      <Card.Content paddingX={6} paddingY={6}>
        <CfRichTextRender
          richTextDocument={cardBody.json}
          lang={lang}
          preview={preview}
          {...ContentfulLivePreview.getProps({
            entryId: id,
            fieldId: "cardBody",
            locale: lang,
          })}
        />
      </Card.Content>

      {buttons.length > 0 && (
        <Card.Actions marginX={6} marginBottom={6}>
          <FlexBox gap={2} flexWrap={"wrap"}>
            {buttons.map((button) => (
              <CfButton
                key={button.sys?.id ?? button.internalTitle}
                {...button}
                id={button.sys?.id ?? ""}
                lang={lang}
                preview={preview}
              />
            ))}
          </FlexBox>
        </Card.Actions>
      )}
    </Card>
  );
};
