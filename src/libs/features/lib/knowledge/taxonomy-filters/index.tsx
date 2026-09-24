"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { TaxonomyConceptNode, TaxonomyFacet } from "@aces/types";
import { palette } from "@aces/theme";
import { Box, Checkbox, FlexBox, Text } from "@aces/ui";

export const CONCEPTS_PARAM = "concepts";
export const RECORD_TYPE_PARAM = "type";

interface TaxonomyFiltersProps {
  facets: TaxonomyFacet[];
  recordTypes?: readonly string[];
  recordTypeLabel?: string;
}

/**
 * Facet sidebar, one group per configured concept scheme.
 *
 * Selection lives in the URL rather than a store so a filtered view is
 * shareable and survives a refresh. Selecting a parent concept matches its
 * descendants too — that happens server-side via the `descendants` filter, so
 * nothing here needs to expand the tree.
 */
export const TaxonomyFilters = ({
  facets,
  recordTypes = [],
  recordTypeLabel = "Article type",
}: TaxonomyFiltersProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selected = useCallback(
    (param: string) => new Set(searchParams.getAll(param)),
    [searchParams],
  );

  const toggle = useCallback(
    (param: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.getAll(param);

      params.delete(param);
      const next = current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value];
      next.forEach((entry) => params.append(param, entry));

      // Any filter change invalidates the current page offset.
      params.delete("page");

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const renderNode = (node: TaxonomyConceptNode, depth = 0) => {
    const chosen = selected(CONCEPTS_PARAM);

    return (
      <Box key={node.id}>
        <FlexBox
          component="label"
          alignItems="center"
          gap={1}
          style={{ paddingLeft: depth * 14, cursor: "pointer" }}
        >
          <Checkbox
            checked={chosen.has(node.id)}
            onChange={() => toggle(CONCEPTS_PARAM, node.id)}
            inputProps={{ "aria-label": node.label }}
          />
          <Text.Small style={{ color: palette.text.primary }}>
            {node.label}
          </Text.Small>
        </FlexBox>
        {node.children.map((child) => renderNode(child, depth + 1))}
      </Box>
    );
  };

  const chosenTypes = selected(RECORD_TYPE_PARAM);

  return (
    <FlexBox
      component="aside"
      flexDirection="column"
      gap={6}
      aria-label="Filters"
    >
      {recordTypes.length > 0 && (
        <Box>
          <Text
            component="h2"
            marginBottom={2}
            style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.02em" }}
          >
            {recordTypeLabel}
          </Text>
          {recordTypes.map((type) => (
            <FlexBox
              key={type}
              component="label"
              alignItems="center"
              gap={1}
              style={{ cursor: "pointer" }}
            >
              <Checkbox
                checked={chosenTypes.has(type)}
                onChange={() => toggle(RECORD_TYPE_PARAM, type)}
                inputProps={{ "aria-label": type }}
              />
              <Text.Small style={{ color: palette.text.primary }}>
                {type}
              </Text.Small>
            </FlexBox>
          ))}
        </Box>
      )}

      {facets.map((facet) => (
        <Box key={facet.scheme.id}>
          <Text
            component="h2"
            marginBottom={2}
            style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.02em" }}
          >
            {facet.scheme.label}
          </Text>
          {facet.tree.length ? (
            facet.tree.map((node) => renderNode(node))
          ) : (
            <Text.Small color={palette.text.secondary}>
              No categories yet.
            </Text.Small>
          )}
        </Box>
      ))}
    </FlexBox>
  );
};
