import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

import { defaultLocale, getLocale } from "@aces/i18n";
import { PageProps } from "@aces/types";
import { toSingleValueArray } from "@aces/utils";
import { palette } from "@aces/theme";
import { Box, Container, H1, Text } from "@aces/ui";
import {
  buildMetadata,
  EnableSearch,
  GlobalSearchQuery,
  SearchBar,
  SearchConfig,
  SEARCH_CONCEPTS_PARAM,
  SearchPageBreadcrumbs,
  SearchResultsList,
  TopicFilter,
} from "@aces/features";
// Imported by path: the service is server-only and must not reach the client
// bundle through the feature barrel.
import { searchKnowledge } from "@aces/features/lib/search/services";

export async function generateMetadata({
  params,
}: {
  params: Promise<PageProps>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = await getLocale(lang, "seo");

  return await buildMetadata(
    {
      title: t?.search?.title ?? "Search",
      description: t?.search?.description ?? "",
    },
    {},
  );
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<PageProps>;
  searchParams: Promise<{ q?: string; topic?: string | string[] }>;
}) {
  const { lang = defaultLocale } = await params;
  const resolvedSearchParams = await searchParams;
  const { isEnabled } = await draftMode();

  if (!EnableSearch) {
    notFound();
  }

  const query = resolvedSearchParams?.[GlobalSearchQuery] ?? "";
  const topics = toSingleValueArray(
    resolvedSearchParams?.[SEARCH_CONCEPTS_PARAM],
  );

  const { results, facets, configured, searched } = await searchKnowledge(
    query,
    {
      limit: SearchConfig.ListingLimit,
      preview: isEnabled,
      locale: lang,
      concepts: topics,
    },
  );

  return (
    <Container maxWidth="lg">
      <Box marginTop={8}>
        <SearchPageBreadcrumbs lang={lang} />
      </Box>

      <Box marginTop={6} style={{ maxWidth: "620px" }}>
        <SearchBar lang={lang} />
      </Box>

      <Box marginTop={10} paddingBottom={12}>
        {query.trim() && (
          <Box
            paddingBottom={5}
            style={{ borderBottom: `1px solid ${palette.border.light}` }}
          >
            <H1 style={{ fontSize: "22px" }}>Results for “{query}”</H1>
            {searched && results.length > 0 && (
              <Text.Small color={palette.text.secondary} marginTop={1}>
                {results.length} {results.length === 1 ? "result" : "results"}
              </Text.Small>
            )}
          </Box>
        )}

        <Box marginTop={query.trim() ? 6 : 0}>
          {query.trim() && <TopicFilter facets={facets} />}

          <SearchResultsList
            results={results}
            query={query}
            configured={configured}
            searched={searched}
          />
        </Box>
      </Box>
    </Container>
  );
}
