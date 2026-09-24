"use client";

import { useEffect, useState } from "react";

import { Box, FlexBox, Icon, Text } from "@aces/ui";
import { palette } from "@aces/theme";

export interface ArticleFeedbackCounts {
  up: number;
  down: number;
}

interface ArticleFeedbackProps {
  entryId: string;
  initialCounts?: ArticleFeedbackCounts | null;
  prompt?: string;
  thanks?: string;
}

/** One vote per article per browser. Convenience, not enforcement. */
const storageKey = (entryId: string) => `article-feedback:${entryId}`;

const readStoredVote = (entryId: string): "up" | "down" | null => {
  try {
    const value = window.localStorage.getItem(storageKey(entryId));
    return value === "up" || value === "down" ? value : null;
  } catch {
    // Private windows and blocked site data throw rather than return null.
    return null;
  }
};

export const ArticleFeedback = ({
  entryId,
  initialCounts,
  prompt = "Was this article helpful?",
  thanks = "Thanks for your feedback.",
}: ArticleFeedbackProps) => {
  const [counts, setCounts] = useState<ArticleFeedbackCounts>({
    up: initialCounts?.up ?? 0,
    down: initialCounts?.down ?? 0,
  });
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  // Read after mount: localStorage is unavailable during SSR, and reading it
  // in render would desync the server and client markup.
  useEffect(() => {
    setVote(readStoredVote(entryId));
  }, [entryId]);

  const submit = async (next: "up" | "down") => {
    if (vote || pending) return;

    setPending(true);
    setFailed(false);

    // Optimistic: the round trip includes a CMA write plus a publish.
    setCounts((current) => ({ ...current, [next]: current[next] + 1 }));
    setVote(next);

    try {
      const response = await fetch("/api/article-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, vote: next }),
      });

      if (!response.ok) throw new Error(`Vote failed: ${response.status}`);

      const result = await response.json();
      setCounts({ up: result.up, down: result.down });

      try {
        window.localStorage.setItem(storageKey(entryId), next);
      } catch {
        // Vote still counted server-side; only the local guard is lost.
      }
    } catch (error) {
      console.error(error);
      // Roll the optimistic update back so the number is not a lie.
      setCounts((current) => ({ ...current, [next]: current[next] - 1 }));
      setVote(null);
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <FlexBox
      flexDirection="column"
      gap={3}
      paddingY={6}
      style={{ borderTop: `1px solid ${palette.grey[300]}` }}
    >
      <Text fontWeight={600}>{vote ? thanks : prompt}</Text>
      <FlexBox gap={4} alignItems="center">
        {(["up", "down"] as const).map((direction) => {
          const active = vote === direction;
          return (
            <button
              key={direction}
              type="button"
              onClick={() => submit(direction)}
              disabled={!!vote || pending}
              aria-pressed={active}
              aria-label={direction === "up" ? "Yes, this was helpful" : "No, this was not helpful"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 999,
                cursor: vote ? "default" : "pointer",
                border: `1px solid ${active ? palette.primary.main : palette.grey[300]}`,
                background: active ? palette.primary.main : "transparent",
                color: active ? palette.common.white : palette.text.primary,
                opacity: vote && !active ? 0.5 : 1,
              }}
            >
              <Icon
                icon={direction === "up" ? "ThumbUpOutlined" : "ThumbDownOutlined"}
                size={18}
                color="inherit"
              />
              <span>{direction === "up" ? "Yes" : "No"}</span>
              <span aria-hidden>{counts[direction]}</span>
            </button>
          );
        })}
      </FlexBox>
      {failed && (
        <Box role="alert">
          <Text.Small color="error.main">
            Sorry — we could not record that. Please try again.
          </Text.Small>
        </Box>
      )}
    </FlexBox>
  );
};
