"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { palette } from "@aces/theme";
import { Box, FlexBox, Text } from "@aces/ui";

import { SEARCH_CONCEPTS_PARAM } from "../config";

interface TopicFilterProps {
  facets: { id: string; label: string; count: number }[];
  label?: string;
}

/**
 * Narrows search results to a taxonomy concept.
 *
 * The facets come from the concepts on the articles the search actually
 * returned, not from the whole taxonomy — a topic with no matches in this
 * result set is not offered, so no selection can lead to an empty page.
 */
export const TopicFilter = ({ facets, label = "Filter by topic" }: TopicFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selected = new Set(searchParams.getAll(SEARCH_CONCEPTS_PARAM));

  const toggle = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.getAll(SEARCH_CONCEPTS_PARAM);

      params.delete(SEARCH_CONCEPTS_PARAM);
      const next = current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id];
      next.forEach((entry) => params.append(SEARCH_CONCEPTS_PARAM, entry));

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  if (!facets.length) return null;

  return (
    <Box marginBottom={6}>
      <Text
        component="h2"
        marginBottom={3}
        style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.02em" }}
      >
        {label}
      </Text>

      <FlexBox flexWrap="wrap" gap={2}>
        {facets.map((facet) => {
          const active = selected.has(facet.id);

          return (
            <button
              key={facet.id}
              type="button"
              onClick={() => toggle(facet.id)}
              aria-pressed={active}
              style={{
                cursor: "pointer",
                font: "inherit",
                fontSize: "13px",
                padding: "5px 12px",
                borderRadius: "999px",
                border: `1px solid ${active ? palette.primary.main : palette.border.default}`,
                background: active ? palette.primary.main : palette.common.white,
                color: active ? palette.common.white : palette.text.primary,
                transition: "background 120ms ease, border-color 120ms ease",
              }}
            >
              {facet.label}{" "}
              <span style={{ opacity: 0.7 }}>{facet.count}</span>
            </button>
          );
        })}
      </FlexBox>
    </Box>
  );
};
