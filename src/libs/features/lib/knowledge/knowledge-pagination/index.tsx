import NextLink from "next/link";

import { palette } from "@aces/theme";
import { Box, FlexBox, Text } from "@aces/ui";

export const PAGE_PARAM = "page";

interface KnowledgePaginationProps {
  /** 1-based. */
  page: number;
  total: number;
  perPage: number;
  /** Path to link to, without a query string. */
  basePath: string;
  /** Every other active query param, preserved across page links. */
  params?: Record<string, string | string[] | undefined>;
}

/**
 * Server-rendered pagination.
 *
 * Plain links rather than a click handler: these listings are Server
 * Components, so a link is both simpler and crawlable — which matters when the
 * search index is built by a crawler following this site.
 */
const buildHref = (
  basePath: string,
  params: Record<string, string | string[] | undefined>,
  page: number,
) => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (key === PAGE_PARAM || value === undefined) continue;
    for (const entry of Array.isArray(value) ? value : [value]) {
      if (entry) search.append(key, entry);
    }
  }

  if (page > 1) search.set(PAGE_PARAM, String(page));

  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
};

/**
 * Compact window around the current page, always including first and last.
 * `null` marks an elision.
 */
const pageWindow = (page: number, pageCount: number): (number | null)[] => {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, pageCount, page]);
  if (page - 1 > 1) pages.add(page - 1);
  if (page + 1 < pageCount) pages.add(page + 1);

  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | null)[] = [];

  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) out.push(null);
    out.push(value);
  });

  return out;
};

const linkStyle = (active: boolean) => ({
  minWidth: "34px",
  height: "34px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 10px",
  borderRadius: "4px",
  fontSize: "14px",
  border: `1px solid ${active ? palette.primary.main : palette.border.default}`,
  background: active ? palette.primary.main : palette.common.white,
  color: active ? palette.common.white : palette.text.primary,
});

export const KnowledgePagination = ({
  page,
  total,
  perPage,
  basePath,
  params = {},
}: KnowledgePaginationProps) => {
  const pageCount = Math.ceil(total / perPage);

  if (pageCount <= 1) return null;

  const current = Math.min(Math.max(page, 1), pageCount);
  const from = (current - 1) * perPage + 1;
  const to = Math.min(current * perPage, total);

  return (
    <FlexBox
      component="nav"
      aria-label="Pagination"
      flexDirection="column"
      alignItems="center"
      gap={3}
      marginTop={8}
    >
      <FlexBox alignItems="center" gap={2} flexWrap="wrap" justifyContent="center">
        {current > 1 && (
          <NextLink
            href={buildHref(basePath, params, current - 1)}
            style={linkStyle(false)}
            rel="prev"
          >
            Previous
          </NextLink>
        )}

        {pageWindow(current, pageCount).map((value, index) =>
          value === null ? (
            <Box key={`gap-${index}`} paddingX={1}>
              <Text.Small color={palette.text.secondary}>…</Text.Small>
            </Box>
          ) : (
            <NextLink
              key={value}
              href={buildHref(basePath, params, value)}
              style={linkStyle(value === current)}
              aria-current={value === current ? "page" : undefined}
            >
              {value}
            </NextLink>
          ),
        )}

        {current < pageCount && (
          <NextLink
            href={buildHref(basePath, params, current + 1)}
            style={linkStyle(false)}
            rel="next"
          >
            Next
          </NextLink>
        )}
      </FlexBox>

      <Text.Small color={palette.text.secondary}>
        {from}–{to} of {total}
      </Text.Small>
    </FlexBox>
  );
};
