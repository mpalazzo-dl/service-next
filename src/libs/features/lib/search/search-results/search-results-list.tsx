import { palette } from "@aces/theme";
import { Box, Text } from "@aces/ui";

import { SearchResultRow } from "./result-row";

interface SearchResultsListProps {
  results: {
    sourceId: string;
    score: number;
    title: string;
    snippet: string;
    article: any | null;
  }[];
  query: string;
  configured: boolean;
  searched: boolean;
  showScore?: boolean;
}

const Notice = ({ children }: { children: React.ReactNode }) => (
  <Box
    paddingY={10}
    paddingX={6}
    style={{
      border: `1px dashed ${palette.border.default}`,
      borderRadius: "4px",
      textAlign: "center",
    }}
  >
    <Text color={palette.text.secondary}>{children}</Text>
  </Box>
);

export const SearchResultsList = ({
  results,
  query,
  configured,
  searched,
  showScore = false,
}: SearchResultsListProps) => {
  if (!configured) {
    // Distinguished from "no matches" on purpose: an unconfigured org is a
    // deployment problem, not an empty result set.
    return (
      <Notice>
        Search is not configured. Set SF_DOMAIN, SF_CLIENT_ID and
        SF_CLIENT_SECRET to connect the knowledge index.
      </Notice>
    );
  }

  if (!query.trim()) {
    return <Notice>Enter a question to search the knowledge base.</Notice>;
  }

  if (searched && !results.length) {
    return <Notice>No results for “{query}”.</Notice>;
  }

  return (
    <Box style={{ borderTop: `1px solid ${palette.border.light}` }}>
      {results.map((result) => (
        <SearchResultRow
          key={result.sourceId}
          title={result.title}
          snippet={result.snippet}
          score={result.score}
          article={result.article}
          showScore={showScore}
        />
      ))}
    </Box>
  );
};
