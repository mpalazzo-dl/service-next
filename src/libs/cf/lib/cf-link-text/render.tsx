"use client";

import { useState } from "react";
import { ContentfulLivePreview } from "@contentful/live-preview";

import { CfBaseComponent, CfLinkReference } from "@aces/types";
import { isExternalReference } from "@aces/utils";
import { palette, typography } from "@aces/theme";
import { FlexBox, Icon, InlineBox } from "@aces/ui";

import { CfLink } from "../cf-link/render";

export interface CfLinkTextProps extends CfBaseComponent {
  link: CfLinkReference;
  title: string;
  alignment?: string;
}

export const CfTextLink = ({
  link,
  title,
  alignment,
  id,
  lang,
}: CfLinkTextProps) => {
  const [hover, setHover] = useState(false);
  const isExternal = isExternalReference(link);
  const flexAlignment =
    alignment === "center"
      ? "center"
      : alignment === "right"
        ? "flex-end"
        : "flex-start";

  const handleHover = (hover: boolean) => {
    setHover(hover);
  };

  const content = (
    <FlexBox
      alignItems="center"
      justifyContent={flexAlignment}
      component="span"
      style={typography.link}
      {...ContentfulLivePreview.getProps({
        entryId: id,
        fieldId: "title",
        locale: lang,
      })}
    >
      <InlineBox
        style={{
          color: hover ? palette.primary.dark : palette.primary.main,
          textDecoration: "underline",
          textUnderlineOffset: "2px",
        }}
      >
        {title}
      </InlineBox>
      {isExternal && (
        <Icon
          icon="OpenInNew"
          size={16}
          marginLeft={2}
          color={hover ? typography.link.color : "inherit"}
          aria-label="opens in new window"
          aria-hidden={false}
          role="img"
        />
      )}
    </FlexBox>
  );

  if (!link) return content;

  return (
    <CfLink
      reference={link}
      lang={lang}
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
      style={{ display: "inline-block" }}
    >
      {content}
    </CfLink>
  );
};
