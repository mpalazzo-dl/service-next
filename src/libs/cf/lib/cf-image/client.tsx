"use client";

import { CSSProperties, useEffect, useState } from "react";
import { useContentfulLiveUpdates } from "@contentful/live-preview/react";

import type { CfFetchById, Nested, ResponsiveSpacing } from "@aces/types";

import { CfImage, CfImageCover } from "./render";
import { fetchImageData } from "./services";
import { ImageSkeleton } from "./skeleton";

export interface CfImageClientProps extends CfFetchById, Nested {
  responsive?: boolean;
  maxHeight?: number;
  style?: CSSProperties;
}

export const CfImageClient = ({
  id,
  preview,
  lang,
  nested,
  responsive,
  maxHeight,
  style,
}: CfImageClientProps) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchImageData(id, preview, lang)
      .then(setData)
      .catch((err) => {
        console.error("Client fetch failed:", err);
      });
  }, [id, preview, lang]);

  const updatedData = useContentfulLiveUpdates(data);

  if (!updatedData) return <ImageSkeleton />;

  return (
    <CfImage
      internalTitle={updatedData.internalTitle}
      image={updatedData.image}
      altText={updatedData.altText}
      footnote={updatedData.footnote}
      __typename={updatedData.__typename}
      nested={nested}
      responsive={responsive}
      maxHeight={maxHeight}
      style={style}
      id={id}
      lang={lang}
      preview={preview}
    />
  );
};

export interface CfImageCoverClientProps extends CfFetchById, Nested {
  coverWidth?: ResponsiveSpacing;
  coverHeight: ResponsiveSpacing;
  borderRadius?: ResponsiveSpacing;
  style?: CSSProperties;
}

export const CfImageCoverClient = ({
  id,
  preview,
  lang,
  borderRadius,
  coverWidth = "100%",
  coverHeight = "380px",
  nested,
  style,
}: CfImageCoverClientProps) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchImageData(id, preview, lang)
      .then(setData)
      .catch((err) => {
        console.error("Client fetch failed:", err);
      });
  }, [id, preview, lang]);

  const updatedData = useContentfulLiveUpdates(data);

  if (!updatedData) return <ImageSkeleton />;

  return (
    <CfImageCover
      internalTitle={updatedData.internalTitle}
      image={updatedData.image}
      borderRadius={borderRadius}
      coverWidth={coverWidth}
      coverHeight={coverHeight}
      nested={nested}
      style={style}
      __typename={updatedData.__typename}
      id={id}
      lang={lang}
      preview={preview}
    />
  );
};
