"use client";

import { useEffect, useState } from "react";
import { useContentfulLiveUpdates } from "@contentful/live-preview/react";

import type { CfFetchById, Nested, SmallPadding } from "@aces/types";

import { CfRichTextSection } from "./render";
import { fetchRichTextSectionData } from "./services";
import { RichTextSectionSkeleton } from "./skeleton";

export interface CfRichTextSectionClientProps
  extends CfFetchById,
    Nested,
    SmallPadding {}

export const CfRichTextSectionClient = ({
  id,
  preview,
  lang,
  nested,
  smallPadding,
}: CfRichTextSectionClientProps) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchRichTextSectionData(id, preview, lang)
      .then(setData)
      .catch((err) => {
        console.error("Client fetch failed:", err);
      });
  }, [id, preview, lang]);

  const updatedData = useContentfulLiveUpdates(data);

  if (!updatedData) return <RichTextSectionSkeleton />;

  return (
    <CfRichTextSection
      internalTitle={updatedData.internalTitle}
      alignment={updatedData.alignment}
      bodyCopy={updatedData.bodyCopy}
      __typename={updatedData.__typename}
      nested={nested}
      smallPadding={smallPadding}
      id={id}
      lang={lang}
      preview={preview}
    />
  );
};
