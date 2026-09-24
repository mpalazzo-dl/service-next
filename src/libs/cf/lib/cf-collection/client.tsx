"use client";

import { useEffect, useState } from "react";
import { useContentfulLiveUpdates } from "@contentful/live-preview/react";

import type { CfFetchById } from "@aces/types";

import { CfCollectionRenderClient } from "./render-client";
import { fetchCollectionData } from "./services";
import { CollectionSkeleton } from "./skeleton";

export const CfCollectionClient = ({ id, preview, lang }: CfFetchById) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchCollectionData(id, preview, lang)
      .then(setData)
      .catch((err) => {
        console.error("Client fetch failed:", err);
      });
  }, [id, preview, lang]);

  const updatedData = useContentfulLiveUpdates(data);

  if (!updatedData) return <CollectionSkeleton />;

  return (
    <CfCollectionRenderClient
      internalTitle={updatedData.internalTitle}
      display={updatedData.display}
      itemsCollection={updatedData.itemsCollection}
      __typename={updatedData.__typename}
      id={id}
      lang={lang}
      preview={preview}
    />
  );
};
