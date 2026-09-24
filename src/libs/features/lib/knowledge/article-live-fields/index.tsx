"use client";

import { useContentfulLiveUpdates } from "@contentful/live-preview/react";
import { ContentfulLivePreview } from "@contentful/live-preview";

import { CfRichTextRenderClient } from "@aces/cf";
import { Box, Chip, FlexBox, H1, Text } from "@aces/ui";

interface ArticleLiveFieldsProps {
  /** The server-fetched article; live updates are patched onto it. */
  article: any;
  concepts: { id: string; label: string }[];
  lang: string;
}

/**
 * The article's own fields, re-rendered live while an editor types.
 *
 * `useContentfulLiveUpdates` patches the entry it is given, so the server's
 * fetch is still the source of the first paint — this only takes over once the
 * editor sends a change. Everything around it (breadcrumbs, child articles,
 * related, table of contents) stays server-rendered, so preview and production
 * are the same page.
 *
 * The client rich-text renderer is used here rather than the server one: its
 * embedded entries subscribe to updates too, so editing a referenced info
 * panel or card is reflected without a reload.
 */
export const ArticleLiveFields = ({
  article,
  concepts,
  lang,
}: ArticleLiveFieldsProps) => {
  const live = useContentfulLiveUpdates(article);
  const entryId = article?.sys?.id;

  const inspector = (fieldId: string) =>
    ContentfulLivePreview.getProps({ entryId, fieldId, locale: lang });

  return (
    <>
      <FlexBox gap={2} alignItems="center" marginTop={4}>
        {live?.recordType && (
          <Chip label={live.recordType} size="small" uppercase={false} />
        )}
        {concepts.map((concept) => (
          <Chip
            key={concept.id}
            label={concept.label}
            size="small"
            uppercase={false}
          />
        ))}
      </FlexBox>

      <H1 marginTop={4} {...inspector("title")}>
        {live?.title}
      </H1>

      {live?.summary && (
        <Text marginTop={3} color="text.secondary" {...inspector("summary")}>
          {live.summary}
        </Text>
      )}

      <Box marginTop={6} {...inspector("bodyCopy")}>
        {live?.bodyCopy?.json && (
          <CfRichTextRenderClient
            richTextDocument={live.bodyCopy.json}
            lang={lang}
            preview
            enableMaxTextWidth
          />
        )}
      </Box>
    </>
  );
};
