"use client";

import { ContentfulLivePreview } from "@contentful/live-preview";

import { CfBaseComponent, CfImageProps, CfRichText, Nested } from "@aces/types";
import { generateId } from "@aces/utils";
import { componentSpacing, palette } from "@aces/theme";
import {
  Accordion,
  AccordionItem,
  AccordionItemTrigger,
  AccordionItemContent,
  Box,
  Container,
  FlexBox,
} from "@aces/ui";

import { CfRichTextRenderClient } from "../cf-rich-text-render/client";
import { useMediaQuery } from "@aces/hooks";
import { CfImage } from "../cf-image/render";

export interface CfAccordionsProps extends CfBaseComponent, Nested {
  hideOnDesktop: boolean;
  defaultOpen: boolean;
  accordionsCollection: {
    items: {
      internalTitle: string;
      icon?: CfImageProps;
      headline: string;
      bodyCopy: CfRichText;
      sys: { id: string };
    }[];
  };
}

export const CfAccordions = ({
  internalTitle,
  hideOnDesktop = false,
  defaultOpen = false,
  accordionsCollection,
  __typename,
  nested = false,
  id,
  preview,
  lang,
}: CfAccordionsProps) => {
  const { isLargerThanMd } = useMediaQuery();

  if (isLargerThanMd && hideOnDesktop) return null;

  return (
    <Box
      id={generateId(internalTitle)}
      data-component={__typename}
      marginY={{ xs: componentSpacing.md, md: componentSpacing.lg }}
    >
      <Container nested={nested}>
        <Accordion
          {...ContentfulLivePreview.getProps({
            entryId: id,
            fieldId: "accordions",
            locale: lang,
          })}
        >
          {accordionsCollection.items.map((item) => (
            <AccordionItem
              key={generateId(item.internalTitle)}
              defaultExpanded={defaultOpen}
              style={{ marginBottom: 4 }}
            >
              <AccordionItemTrigger
                expandIconPosition="end"
                disableGutters={true}
                style={{
                  borderTop: `1px solid ${palette.border.light}`,
                  borderLeft: `1px solid ${palette.border.light}`,
                  borderRight: `1px solid ${palette.border.light}`,
                  borderBottom: `1px solid ${palette.border.default}`,
                  padding: 4,
                }}
              >
                <FlexBox alignItems={"center"} gap={8}>
                  {item.icon && (
                    <CfImage
                      __typename={item.icon.__typename}
                      id={item.icon.id}
                      image={item.icon.image}
                      altText={item.icon.altText}
                      internalTitle={item.icon.internalTitle}
                      lang={lang}
                      preview={preview}
                      nested
                    />
                  )}
                  {item.headline}
                </FlexBox>
              </AccordionItemTrigger>
              <AccordionItemContent
                style={{
                  background: palette.grey[200],
                  paddingY: 6,
                  paddingX: 4,
                }}
              >
                <CfRichTextRenderClient
                  richTextDocument={item.bodyCopy.json}
                  lang={lang}
                  preview={preview}
                />
              </AccordionItemContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </Box>
  );
};
