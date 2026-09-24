"use client";

import { useEffect, useState } from "react";
import { useContentfulLiveUpdates } from "@contentful/live-preview/react";

import type { CfFetchById } from "@aces/types";

import { CfInfoPanelRenderClient } from "./render-client";
import { fetchInfoPanelData } from "./services";
import { InfoPanelSkeleton } from "./skeleton";

export const CfInfoPanelClient = ({ id, preview, lang }: CfFetchById) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchInfoPanelData(id, preview, lang)
      .then(setData)
      .catch((err) => {
        console.error("Client fetch failed:", err);
      });
  }, [id, preview, lang]);

  const updatedData = useContentfulLiveUpdates(data);

  if (!updatedData) return <InfoPanelSkeleton />;

  return (
    <CfInfoPanelRenderClient
      internalTitle={updatedData.internalTitle}
      type={updatedData.type}
      text={updatedData.text}
      __typename={updatedData.__typename}
      id={id}
      lang={lang}
      preview={preview}
    />
  );
};
