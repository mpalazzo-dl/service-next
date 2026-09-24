import React from "react";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, Document, INLINES, Node } from "@contentful/rich-text-types";

import { CfAlignment, CfBaseComponent } from "@aces/types";
import { slugify } from "@aces/utils";
import { maxTextWidth, palette, typography } from "@aces/theme";
import { Box, FlexBox, H1, H2, H3, H4, H5, H6, Text } from "@aces/ui";
// Relative imports, not the `@aces/cf` barrel: importing the barrel from
// inside the library creates a cycle and a temporal-dead-zone crash at runtime.
import { CfAccordionsServer } from "../cf-accordions";
import { CfBannerServer } from "../cf-banner";
import { CfButtonServer } from "../cf-button";
import { CfCodeEmbedServer } from "../cf-code-embed";
import { CfCollectionServer } from "../cf-collection";
import { CfImageServer } from "../cf-image";
import { CfInfoPanelServer } from "../cf-info-panel";
import { CfLinkTextServer } from "../cf-link-text";
import { CfLockupServer } from "../cf-lockup";
import { CfRichTextSectionServer } from "../cf-rich-text-section";
import { CfVideoEmbedServer } from "../cf-video-embed";

import { fetchRichTextEmbedEntry } from "./services";
import style from "./style.module.css";

export interface CfRichTextRenderProps
  extends Pick<CfBaseComponent, "lang" | "preview"> {
  richTextDocument: Document;
  color?: string;
  alignment?: CfAlignment;
  baseFontSize?: string;
  enableMaxTextWidth?: boolean;
  columns?: string;
}

/** Plain text of a rich-text node, used to derive a heading anchor. */
const nodeText = (node: any): string =>
  (node.content ?? [])
    .map((child: any) =>
      child.nodeType === "text" ? child.value : nodeText(child),
    )
    .join("");

const mapAlignment = (
  alignment: CfAlignment,
): "center" | "inherit" | "justify" | "left" | "right" | undefined => {
  const lowerCaseAlignment = alignment.toLowerCase();
  switch (lowerCaseAlignment) {
    case "center":
    case "inherit":
    case "justify":
    case "left":
    case "right":
      return lowerCaseAlignment as
        | "center"
        | "inherit"
        | "justify"
        | "left"
        | "right";
    default:
      return undefined;
  }
};

const flexMapAlignment = (alignment: CfAlignment) => {
  switch (alignment) {
    case "Center":
      return "center";
    case "Right":
      return "flex-end";
    default:
      return "flex-start";
  }
};

export const CfRichTextRender = ({
  richTextDocument,
  color = palette.text.primary,
  alignment = "Left",
  baseFontSize = typography.body1.fontSize,
  enableMaxTextWidth = false,
  columns,
  lang,
  preview,
  ...rest
}: CfRichTextRenderProps) => {
  const processChildrenWithLineBreaks = (
    children: React.ReactNode,
  ): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (typeof child === "string") {
        return child.split("\n").map((line, index, array) => (
          <React.Fragment key={index}>
            {line}
            {index < array.length - 1 && <br />}
          </React.Fragment>
        ));
      }

      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<any>, {
          //@ts-expect-error: children is not a prop of ReactElement
          children: processChildrenWithLineBreaks(child.props?.children),
        });
      }

      return child;
    });
  };

  const CfText = ({ children }: { children: React.ReactNode }) => {
    return (
      <Text
        align={mapAlignment(alignment)}
        style={{
          fontSize: "inherit",
          lineHeight: "inherit",
          paddingBottom: "1rem",
          maxWidth: enableMaxTextWidth ? maxTextWidth : "none",
          marginX:
            enableMaxTextWidth && alignment === "Center" ? "auto" : "inherit",
          "&:last-child": { paddingBottom: 0 },
        }}
      >
        {processChildrenWithLineBreaks(children)}
      </Text>
    );
  };

  const options = {
    renderNode: {
      [BLOCKS.PARAGRAPH]: (node: Node, children: React.ReactNode) => (
        <CfText>{children}</CfText>
      ),
      [BLOCKS.HEADING_1]: (node: Node, children: React.ReactNode) => (
        <H1
          align={mapAlignment(alignment)}
          style={{
            marginBottom: "1rem",
            maxWidth: enableMaxTextWidth ? maxTextWidth : "none",
            marginX:
              enableMaxTextWidth && alignment === "Center" ? "auto" : "inherit",
          }}
        >
          {children}
        </H1>
      ),
      [BLOCKS.HEADING_2]: (node: Node, children: React.ReactNode) => (
        <H2
          id={slugify(nodeText(node))}
          align={mapAlignment(alignment)}
          style={{
            marginBottom: "1rem",
            maxWidth: enableMaxTextWidth ? maxTextWidth : "none",
            marginX:
              enableMaxTextWidth && alignment === "Center" ? "auto" : "inherit",
          }}
        >
          {children}
        </H2>
      ),
      [BLOCKS.HEADING_3]: (node: Node, children: React.ReactNode) => (
        <H3
          id={slugify(nodeText(node))}
          align={mapAlignment(alignment)}
          style={{
            marginBottom: "1rem",
            maxWidth: enableMaxTextWidth ? maxTextWidth : "none",
            marginX:
              enableMaxTextWidth && alignment === "Center" ? "auto" : "inherit",
          }}
        >
          {children}
        </H3>
      ),
      [BLOCKS.HEADING_4]: (node: Node, children: React.ReactNode) => (
        <H4
          align={mapAlignment(alignment)}
          style={{
            marginBottom: ".75rem",
            maxWidth: enableMaxTextWidth ? maxTextWidth : "none",
            marginX:
              enableMaxTextWidth && alignment === "Center" ? "auto" : "inherit",
          }}
        >
          {children}
        </H4>
      ),
      [BLOCKS.HEADING_5]: (node: Node, children: React.ReactNode) => (
        <H5
          align={mapAlignment(alignment)}
          style={{
            marginBottom: ".5rem",
            maxWidth: enableMaxTextWidth ? maxTextWidth : "none",
            marginX:
              enableMaxTextWidth && alignment === "Center" ? "auto" : "inherit",
          }}
        >
          {children}
        </H5>
      ),
      [BLOCKS.HEADING_6]: (node: Node, children: React.ReactNode) => (
        <H6
          align={mapAlignment(alignment)}
          style={{
            marginBottom: ".5rem",
            maxWidth: enableMaxTextWidth ? maxTextWidth : "none",
            marginX:
              enableMaxTextWidth && alignment === "Center" ? "auto" : "inherit",
          }}
        >
          {children}
        </H6>
      ),
      [BLOCKS.EMBEDDED_ENTRY]: async (node: Node) => {
        const id = node.data.target.sys.id;

        const entry = await fetchRichTextEmbedEntry(id);
        const typename = entry.__typename;

        switch (typename) {
          case "Accordions":
            return (
              <CfAccordionsServer
                id={id}
                preview={preview}
                lang={lang}
                nested
              />
            );
          case "Banner":
            return <CfBannerServer id={id} preview={preview} lang={lang} />;
          case "CodeEmbed":
            return (
              <CfCodeEmbedServer id={id} preview={preview} lang={lang} nested />
            );
          case "Collection":
            return <CfCollectionServer id={id} preview={preview} lang={lang} />;
          case "Image":
            return (
              <FlexBox marginY={2} justifyContent={flexMapAlignment(alignment)}>
                <CfImageServer
                  id={id}
                  preview={preview}
                  lang={lang}
                  nested
                  // Intrinsic width with a height cap: an oversized asset
                  // scales down instead of filling the whole measure.
                  responsive={false}
                  maxHeight={420}
                />
              </FlexBox>
            );
          case "InfoPanel":
            return <CfInfoPanelServer id={id} preview={preview} lang={lang} />;
          case "Lockup":
            return (
              <CfLockupServer id={id} preview={preview} lang={lang} nested />
            );
          case "RichTextSection":
            return (
              <CfRichTextSectionServer
                id={id}
                preview={preview}
                lang={lang}
                nested
              />
            );
          case "VideoEmbed":
            return (
              <CfVideoEmbedServer
                id={id}
                preview={preview}
                lang={lang}
                nested
              />
            );
          default:
            return null;
        }
      },
      [INLINES.EMBEDDED_ENTRY]: async (node: Node) => {
        const id = node.data.target.sys.id;

        const entry = await fetchRichTextEmbedEntry(id);
        const typename = entry.__typename;

        switch (typename) {
          case "Button":
            return <CfButtonServer id={id} preview={preview} lang={lang} />;
          case "LinkText":
            return (
              <CfLinkTextServer
                id={id}
                preview={preview}
                lang={lang}
                alignment={mapAlignment(alignment)}
              />
            );
          default:
            return null;
        }
      },
    },
  };

  return (
    <Box
      className={style.richText}
      style={{
        color: color,
        fontSize: baseFontSize,
        lineHeight: 1.75,
        columns: columns,
        columnGap: { xs: "80px", md: "100px" },
        "& > p": {
          breakInside: "avoid",
          overflowWrap: "break-word",
          wordBreak: "break-word",
        },
      }}
      {...rest}
    >
      {documentToReactComponents(richTextDocument, options)}
    </Box>
  );
};
