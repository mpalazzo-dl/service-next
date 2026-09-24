"use client";

import { useEffect, useState } from "react";
import { useContentfulLiveUpdates } from "@contentful/live-preview/react";

import type { CfFetchById, Nested } from "@aces/types";

import { CfVideoEmbed } from "./render";
import { fetchVideoEmbedData } from "./services";
import { VideoEmbedSkeleton } from "./skeleton";

export interface CfVideoEmbedClientProps extends CfFetchById, Nested {}

export const CfVideoEmbedClient = ({
  id,
  preview,
  lang,
  nested,
}: CfVideoEmbedClientProps) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchVideoEmbedData(id, preview, lang)
      .then(setData)
      .catch((err) => {
        console.error("Client fetch failed:", err);
      });
  }, [id, preview, lang]);

  const updatedData = useContentfulLiveUpdates(data);

  if (!updatedData) return <VideoEmbedSkeleton />;

  return (
    <CfVideoEmbed
      internalTitle={updatedData.internalTitle}
      embedCode={updatedData.embedCode}
      nested={nested}
      __typename={updatedData.__typename}
      id={id}
      lang={lang}
      preview={preview}
    />
  );
};
