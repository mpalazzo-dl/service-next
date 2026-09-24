"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { RouteDirectory } from "@aces/types";
import { slugify } from "@aces/utils";
import { palette, shape } from "@aces/theme";
import { Box, Container, FlexBox, H1, Icon, Text } from "@aces/ui";

interface KbHeroProps {
  title: string;
  subtitle?: string;
  placeholder?: string;
  popularSearches?: string[];
  popularLabel?: string;
  /** The search results route's query parameter. */
  queryParam?: string;
}

/**
 * Search-led hero. A help center's primary navigation is the search field —
 * category browse is the fallback, not the other way round.
 */
export const KbHero = ({
  title,
  subtitle,
  placeholder = "Search for answers",
  popularSearches = [],
  popularLabel = "Popular searches",
  queryParam = "q",
}: KbHeroProps) => {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const search = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    router.push(`${RouteDirectory.Search}?${queryParam}=${encodeURIComponent(trimmed)}`);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    search(query);
  };

  return (
    <Box
      component="section"
      style={{
        background: palette.grey[100],
        borderBottom: `1px solid ${palette.border.default}`,
      }}
    >
      <Container maxWidth="lg">
        <FlexBox
          flexDirection="column"
          alignItems="center"
          paddingY={{ xs: 10, md: 16 }}
        >
          <H1 align="center">{title}</H1>

          {subtitle && (
            <Text
              align="center"
              color={palette.text.secondary}
              marginTop={3}
              style={{ maxWidth: "560px" }}
            >
              {subtitle}
            </Text>
          )}

          {/* Native form/input: the Box wrapper only forwards layout props. */}
          <form
            role="search"
            onSubmit={onSubmit}
            style={{ width: "100%", maxWidth: "620px", marginTop: "28px" }}
          >
            <FlexBox
              alignItems="center"
              style={{
                background: palette.common.white,
                border: `1px solid ${palette.border.input}`,
                borderRadius: `${shape.borderRadius}px`,
                paddingLeft: "14px",
                height: "48px",
                transition: "border-color 120ms ease, box-shadow 120ms ease",
              }}
            >
              <Icon icon="Search" size={20} color={palette.grey[700]} aria-hidden />
              <input
                type="search"
                aria-label={placeholder}
                placeholder={placeholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                style={{
                  flex: 1,
                  height: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  padding: "0 14px",
                  fontSize: "15px",
                  fontFamily: "inherit",
                  color: palette.text.primary,
                }}
              />
            </FlexBox>
          </form>

          {popularSearches.length > 0 && (
            <FlexBox
              alignItems="center"
              justifyContent="center"
              flexWrap="wrap"
              gap={2}
              marginTop={4}
            >
              <Text.Small color={palette.text.secondary}>
                {popularLabel}
              </Text.Small>
              {popularSearches.map((term) => (
                <button
                  key={slugify(term)}
                  type="button"
                  onClick={() => search(term)}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0,
                    font: "inherit",
                    fontSize: "13px",
                    color: palette.primary.main,
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                  }}
                >
                  {term}
                </button>
              ))}
            </FlexBox>
          )}
        </FlexBox>
      </Container>
    </Box>
  );
};
