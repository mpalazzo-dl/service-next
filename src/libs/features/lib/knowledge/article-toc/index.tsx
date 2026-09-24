"use client";

import { useEffect, useMemo, useState } from "react";
import { Document } from "@contentful/rich-text-types";

import { slugify } from "@aces/utils";
import { palette } from "@aces/theme";
import { Box, FlexBox, Text } from "@aces/ui";

interface TocEntry {
  id: string;
  label: string;
  depth: 2 | 3;
}

/**
 * Table of contents derived from the article body's heading nodes.
 *
 * Ids come from the same `slugify` the rich-text heading renderer uses, so the
 * two stay in step without a shared registry.
 */
const collectHeadings = (document?: Document): TocEntry[] => {
  if (!document?.content) return [];

  const text = (node: any): string =>
    (node.content ?? [])
      .map((child: any) => (child.nodeType === "text" ? child.value : text(child)))
      .join("");

  return document.content
    .filter((node: any) => node.nodeType === "heading-2" || node.nodeType === "heading-3")
    .map((node: any) => {
      const label = text(node).trim();
      return {
        id: slugify(label),
        label,
        depth: node.nodeType === "heading-2" ? (2 as const) : (3 as const),
      };
    })
    .filter((entry) => entry.label.length > 0);
};

export const ArticleToc = ({
  bodyCopy,
  title = "On this page",
}: {
  bodyCopy?: { json: Document };
  title?: string;
}) => {
  const entries = useMemo(() => collectHeadings(bodyCopy?.json), [bodyCopy]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!entries.length) return;

    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      // Bias toward the top of the viewport so the active item is the heading
      // the reader has just passed, not one still below the fold.
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );

    entries.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [entries]);

  if (entries.length < 2) return null;

  return (
    <Box component="nav" aria-label={title}>
      <Text fontWeight={600} marginBottom={3}>
        {title}
      </Text>
      <FlexBox flexDirection="column" gap={2}>
        {entries.map((entry) => (
          <a
            key={entry.id}
            href={`#${entry.id}`}
            style={{
              paddingLeft: entry.depth === 3 ? 16 : 0,
              borderLeft: `2px solid ${
                active === entry.id ? palette.primary.main : "transparent"
              }`,
              paddingInlineStart: entry.depth === 3 ? 24 : 12,
              color: active === entry.id ? palette.primary.main : palette.text.secondary,
              textDecoration: "none",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {entry.label}
          </a>
        ))}
      </FlexBox>
    </Box>
  );
};
