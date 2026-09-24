import React from "react";
import NextLink from "next/link";

import { CfLinkReference } from "@aces/types";
import { resolveLinkHref } from "@aces/utils";

export interface BaseLinkProps {
  children: React.ReactNode;
  /**
   * Either a `Link` (internal entry reference) or an `ExternalLink` (URL).
   * Which one it is decides the href *and* whether the external icon shows —
   * there is no authored flag to disagree with.
   */
  reference?: CfLinkReference | null;
  className?: string;
  style?: React.CSSProperties;
  lang?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const LinkInheritStyles = {
  fontSize: "inherit",
  color: "inherit",
  textDecoration: "inherit",
};

export const BaseLink = ({
  reference,
  className,
  style,
  children,
  lang,
  onMouseEnter,
  onMouseLeave,
}: BaseLinkProps) => {
  const { href, target, isExternal } = resolveLinkHref(reference);

  return (
    <NextLink
      href={href}
      hrefLang={lang}
      target={target}
      // An external link opening in a new tab hands the opener to the
      // destination without this.
      rel={isExternal && target === "_blank" ? "noopener noreferrer" : undefined}
      className={className}
      style={{ ...LinkInheritStyles, ...style }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </NextLink>
  );
};

export const CfLink = (props: BaseLinkProps) => <BaseLink {...props} />;
