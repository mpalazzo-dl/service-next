"use client";

import { useEffect, useState } from "react";
import { useContentfulLiveUpdates } from "@contentful/live-preview/react";

import type { CfFetchById, Nested } from "@aces/types";

import { CfCodeEmbed } from "./render";
import { fetchCodeEmbedData } from "./services";
import { CodeEmbedSkeleton } from "./skeleton";

export interface CfCodeEmbedClientProps extends CfFetchById, Nested {}

export const CfCodeEmbedClient = ({
  id,
  preview,
  lang,
  nested,
}: CfCodeEmbedClientProps) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchCodeEmbedData(id, preview, lang)
      .then(setData)
      .catch((err) => {
        console.error("Client fetch failed:", err);
      });
  }, [id, preview, lang]);

  const updatedData = useContentfulLiveUpdates(data);

  if (!updatedData) return <CodeEmbedSkeleton />;

  return (
    <CfCodeEmbed
      internalTitle={updatedData.internalTitle}
      code={updatedData.code}
      nested={nested}
      __typename={updatedData.__typename}
      id={id}
      lang={lang}
      preview={preview}
    />
  );
};
