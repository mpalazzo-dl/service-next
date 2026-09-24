"use client";

import { useEffect, useState } from "react";
import { useContentfulLiveUpdates } from "@contentful/live-preview/react";

import type { CfFetchById, Nested } from "@aces/types";

import { CfLockup } from "./render";
import { fetchLockup } from "./services";
import { LockupSkeleton } from "./skeleton";

export interface CfLockupClientProps extends CfFetchById, Nested {}

export const CfLockupClient = ({
  id,
  preview,
  lang,
  nested,
}: CfLockupClientProps) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchLockup(id, preview, lang)
      .then(setData)
      .catch((err) => {
        console.error("Client fetch failed:", err);
      });
  }, [id, preview, lang]);

  const updatedData = useContentfulLiveUpdates(data);

  if (!updatedData) return <LockupSkeleton />;

  return (
    <CfLockup
      internalTitle={updatedData.internalTitle}
      headline={updatedData.headline}
      subhead={updatedData.subhead}
      bodyCopy={updatedData.bodyCopy}
      buttonsCollection={updatedData.buttonsCollection}
      media={updatedData.media}
      mediaSize={updatedData.mediaSize}
      mediaAlignment={updatedData.mediaAlignment}
      mediaBleed={updatedData.mediaBleed}
      __typename={updatedData.__typename}
      nested={nested}
      id={id}
      lang={lang}
      preview={preview}
    />
  );
};
