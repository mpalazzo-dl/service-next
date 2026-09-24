"use client";

import { CSSProperties, useState } from "react";

import { defaultLocale } from "@aces/i18n";
import { CfLinkReference } from "@aces/types";
import { isExternalReference } from "@aces/utils";
import { typography } from "@aces/theme";
import { FlexBox, Icon, Text } from "@aces/ui";
import { CfLink } from "@aces/cf";

interface MenuLinkProps {
  link: CfLinkReference;
  title: string;
  lang: string;
  fontSize?: string;
  fontFamily?: string;
  style?: CSSProperties;
  hoverEffect?: boolean;
}

export const MenuLink = ({
  link,
  title,
  lang = defaultLocale,
  fontSize,
  fontFamily,
  style,
  hoverEffect = false,
}: MenuLinkProps) => {
  const [hover, setHover] = useState(false);

  // Derived, never authored: an `ExternalLink` reference is external by
  // definition, so the icon can't drift out of sync with the destination.
  const isExternal = isExternalReference(link);

  const handleHover = (hover: boolean) => {
    if (hoverEffect) {
      setHover(hover);
    }
  };

  return (
    <CfLink
      reference={link}
      lang={lang}
      style={style}
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
    >
      <FlexBox alignItems="center">
        <Text
          style={{
            fontSize: fontSize,
            fontFamily: fontFamily,
            transition: "color 100ms",
            color: hover ? typography.link.color : "inherit",
          }}
        >
          {title}
        </Text>
        {isExternal && (
          <Icon
            icon="OpenInNew"
            size={16}
            marginLeft={2}
            color={hover ? typography.link.color : "inherit"}
            aria-label="opens in new window"
            role="img"
            aria-hidden={false}
          />
        )}
      </FlexBox>
    </CfLink>
  );
};
