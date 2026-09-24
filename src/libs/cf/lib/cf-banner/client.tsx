"use client";

import { useEffect, useState } from "react";
import { useContentfulLiveUpdates } from "@contentful/live-preview/react";

import type { CfFetchById } from "@aces/types";

import { CfBanner } from "./render";
import { fetchBannerData } from "./services";
import { BannerSkeleton } from "./skeleton";

export const CfBannerClient = ({ id, preview, lang }: CfFetchById) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchBannerData(id, preview, lang)
      .then(setData)
      .catch((err) => {
        console.error("Client fetch failed:", err);
      });
  }, [id, preview, lang]);

  const updatedData = useContentfulLiveUpdates(data);

  if (!updatedData) return <BannerSkeleton />;

  return (
    <CfBanner
      internalTitle={updatedData.internalTitle}
      headline={updatedData.headline}
      bodyCopy={updatedData.bodyCopy}
      button={updatedData.button}
      buttonsCollection={updatedData.buttonsCollection}
      theme={updatedData.theme}
      media={updatedData.media}
      mediaAlignment={updatedData.mediaAlignment}
      __typename={updatedData.__typename}
      id={id}
      lang={lang}
      preview={preview}
    />
  );
};
