"use client";

import React, { useEffect, useState } from "react";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, Document, INLINES, Node } from "@contentful/rich-text-types";

import { CfAlignment, CfBaseComponent } from "@aces/types";
import { slugify } from "@aces/utils";
import { maxTextWidth, palette, typography } from "@aces/theme";
import { Box, FlexBox, H1, H2, H3, H4, H5, H6, Text } from "@aces/ui";
// Relative imports, not the `@aces/cf` barrel: importing the barrel from
// inside the library creates a cycle and a temporal-dead-zone crash at runtime.
import { CfAccordionsClient } from "../cf-accordions/client";
import { CfBannerClient } from "../cf-banner/client";
import { CfCodeEmbedClient } from "../cf-code-embed/client";
import { CfCollectionClient } from "../cf-collection/client";
import { CfImageClient } from "../cf-image/client";
import { CfInfoPanelClient } from "../cf-info-panel/client";
import { CfLockupClient } from "../cf-lockup/client";
import { CfRichTextSectionClient } from "../cf-rich-text-section/client";
import { CfVideoEmbedClient } from "../cf-video-embed/client";

import { CfButton } from "../cf-button/render";
import { fetchButton } from "../cf-button/services";
import { CfTextLink } from "../cf-link-text/render";
import { fetchLinkTextData } from "../cf-link-text/services";

import { fetchRichTextEmbedEntry } from "./services";
import style from "./style.module.css";

export interface CfRichTextRenderClientProps
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

interface RichTextEmbedBlockProps
  extends Pick<CfBaseComponent, "lang" | "preview"> {
  id: string;
  alignment: CfAlignment;
}

const RichTextEmbedBlock = ({
  id,
  preview,
  lang,
  alignment,
}: RichTextEmbedBlockProps) => {
  const [typename, setTypename] = useState<string | null>(null);

  useEffect(() => {
    fetchRichTextEmbedEntry(id, preview, lang)
      .then((entry) => {
        if (entry?.__typename) setTypename(entry.__typename);
      })
      .catch((err) => console.error("Embed lookup failed:", err));
  }, [id, preview, lang]);

  if (!typename) return null;

  switch (typename) {
    case "Accordions":
      return (
        <CfAccordionsClient id={id} preview={preview} lang={lang} nested />
      );
    case "CodeEmbed":
      return <CfCodeEmbedClient id={id} preview={preview} lang={lang} nested />;
    case "Banner":
      return <CfBannerClient id={id} preview={preview} lang={lang} />;
    case "Collection":
      return <CfCollectionClient id={id} preview={preview} lang={lang} />;
    case "InfoPanel":
      return <CfInfoPanelClient id={id} preview={preview} lang={lang} />;
    case "RichTextSection":
      return (
        <CfRichTextSectionClient id={id} preview={preview} lang={lang} nested />
      );
    case "Image":
      return (
        <FlexBox marginY={2} justifyContent={flexMapAlignment(alignment)}>
          <CfImageClient
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
    case "Lockup":
      return <CfLockupClient id={id} preview={preview} lang={lang} nested />;
    case "VideoEmbed":
      return (
        <CfVideoEmbedClient id={id} preview={preview} lang={lang} nested />
      );
    default:
      return null;
  }
};

interface RichTextEmbedInlineProps
  extends Pick<CfBaseComponent, "lang" | "preview"> {
  id: string;
  alignment: CfAlignment;
}

const RichTextEmbedInline = ({
  id,
  preview,
  lang,
  alignment,
}: RichTextEmbedInlineProps) => {
  const [data, setData] = useState<any>(null);
  const [typename, setTypename] = useState<string | null>(null);

  useEffect(() => {
    fetchRichTextEmbedEntry(id, preview, lang)
      .then((entry) => {
        if (!entry?.__typename) return;
        setTypename(entry.__typename);
        if (entry.__typename === "Button") {
          return fetchButton(id, preview, lang).then(setData);
        }
        if (entry.__typename === "LinkText") {
          return fetchLinkTextData(id, preview, lang).then(setData);
        }
      })
      .catch((err) => console.error("Inline embed lookup failed:", err));
  }, [id, preview, lang]);

  if (!typename || !data) return null;

  switch (typename) {
    case "Button":
      return (
        <CfButton
          internalTitle={data.internalTitle}
          title={data.title}
          link={data.link}
          buttonStyle={data.buttonStyle}
          rightIcon={data.rightIcon}
          fullWidthMobile={data.fullWidthMobile}
          __typename={data.__typename}
          id={id}
          lang={lang}
          preview={preview}
        />
      );
    case "LinkText":
      return (
        <CfTextLink
          internalTitle={data.internalTitle}
          link={data.link}
          title={data.title}
          alignment={mapAlignment(alignment)}
          __typename={data.__typename}
          id={data?.sys?.id || id}
          lang={lang}
          preview={preview}
        />
      );
    default:
      return null;
  }
};

export const CfRichTextRenderClient = ({
  richTextDocument,
  color = palette.text.primary,
  alignment = "Left",
  baseFontSize = typography.body1.fontSize,
  enableMaxTextWidth = false,
  columns,
  lang,
  preview,
  ...rest
}: CfRichTextRenderClientProps) => {
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
      [BLOCKS.EMBEDDED_ENTRY]: (node: Node) => {
        const id = node.data.target.sys.id;
        return (
          <RichTextEmbedBlock
            id={id}
            preview={preview}
            lang={lang}
            alignment={alignment}
          />
        );
      },
      [INLINES.EMBEDDED_ENTRY]: (node: Node) => {
        const id = node.data.target.sys.id;
        return (
          <RichTextEmbedInline
            id={id}
            preview={preview}
            lang={lang}
            alignment={alignment}
          />
        );
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
