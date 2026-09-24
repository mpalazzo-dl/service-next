"use client";
import { ContentfulLivePreview } from "@contentful/live-preview";

import {
  CfAlignment,
  CfBaseComponent,
  CfImageProps,
  CfRichText,
} from "@aces/types";
import { generateId } from "@aces/utils";
import { useMediaQuery } from "@aces/hooks";
import { componentSpacing, palette } from "@aces/theme";
import { Box, Container, H3, Row, Col, FlexBox } from "@aces/ui";

import { CfButton, CfButtonProps } from "../cf-button/render";
import { CfImage } from "../cf-image/render";
import { CfRichTextRenderClient } from "../cf-rich-text-render/client";

export interface CfBannerProps extends CfBaseComponent {
  headline?: string;
  bodyCopy?: CfRichText;
  button?: CfButtonProps;
  buttonsCollection?: {
    items: CfButtonProps[];
  };
  media: CfImageProps;
  mediaAlignment: CfAlignment;
  theme: string;
}

export const CfBanner = ({
  internalTitle,
  headline,
  bodyCopy,
  button,
  buttonsCollection,
  media,
  mediaAlignment,
  theme,
  __typename,
  id,
  lang,
  preview,
}: CfBannerProps) => {
  const color = theme === "Primary Gradient" ? "common.white" : "text.primary";
  const isMobile = useMediaQuery().isSmallerThanMd;
  const align = mediaAlignment === "Center" ? "center" : "left";
  const textAlign = mediaAlignment === "Center" ? "Center" : "Left";

  return (
    <Box
      id={generateId(internalTitle)}
      data-component={__typename}
      paddingY={{ xs: componentSpacing.lg, md: componentSpacing.xl }}
      style={{
        background:
          theme === "White"
            ? palette.common.white
            : theme === "Blue Gray"
              ? palette.tertiary.grayblue
              : mediaAlignment === "Right"
                ? palette.gradient.primaryMainLight270
                : palette.gradient.primaryMainLight90,
      }}
    >
      <Container>
        <Row
          alignItems={"center"}
          flexDirection={{
            xs: "column-reverse",
            md:
              mediaAlignment === "Right"
                ? "row"
                : mediaAlignment === "Left"
                  ? "row-reverse"
                  : "column-reverse",
          }}
          rowSpacing={8}
        >
          {(headline || bodyCopy || button) && (
            <Col size={{ xs: 12, md: mediaAlignment === "Center" ? 8 : 6 }}>
              <FlexBox
                maxWidth={mediaAlignment === "Center" ? "none" : "500px"}
                flexDirection={"column"}
                alignItems={align}
                marginLeft={mediaAlignment === "Left" ? "auto" : "0px"}
                height={"100%"}
                gap={6}
              >
                {headline && (
                  <H3
                    align={align}
                    color={color}
                    marginBottom={2}
                    {...ContentfulLivePreview.getProps({
                      entryId: id,
                      fieldId: "headline",
                      locale: lang,
                    })}
                  >
                    {headline}
                  </H3>
                )}
                {bodyCopy && (
                  <CfRichTextRenderClient
                    alignment={textAlign}
                    color={color}
                    richTextDocument={bodyCopy.json}
                    lang={lang}
                    preview={preview}
                    {...ContentfulLivePreview.getProps({
                      entryId: id,
                      fieldId: "bodyCopy",
                      locale: lang,
                    })}
                  />
                )}
                {buttonsCollection && buttonsCollection.items.length ? (
                  <FlexBox
                    gap={5}
                    flexDirection={{ xs: "column", md: "row" }}
                    flexWrap={"wrap"}
                    alignItems={"center"}
                    width={isMobile ? "100%" : {}}
                  >
                    {buttonsCollection.items.map((item) => {
                      return (
                        <FlexBox
                          key={generateId(item.internalTitle)}
                          style={{ flex: 1, width: "100%" }}
                        >
                          <CfButton
                            key={generateId(item.internalTitle)}
                            internalTitle={item.internalTitle}
                            title={item.title}
                            link={item.link}
                            buttonStyle={item.buttonStyle}
                            customStyles={{
                              width: isMobile ? "100%" : {},
                              justifyContent: "space-between",
                              whiteSpace: "nowrap",
                            }}
                            rightIcon={item.rightIcon}
                            fullWidth={true}
                            fullWidthMobile={true}
                            __typename={item.__typename}
                            id={item?.sys?.id || ""}
                            preview={preview}
                            lang={lang}
                          />
                        </FlexBox>
                      );
                    })}
                  </FlexBox>
                ) : (
                  <></>
                )}
              </FlexBox>
            </Col>
          )}
          {media && (
            <Col size={{ xs: 12, md: mediaAlignment === "Center" ? 9 : 6 }}>
              <FlexBox flexDirection={"column"}>
                <CfImage
                  internalTitle={media.internalTitle}
                  image={media.image}
                  altText={media.altText}
                  nested={true}
                  __typename={media.__typename}
                  id={id}
                  lang={lang}
                  preview={preview}
                />
              </FlexBox>
            </Col>
          )}
        </Row>
      </Container>
    </Box>
  );
};
