"use client";

import { useEffect, useState } from "react";
import { useContentfulLiveUpdates } from "@contentful/live-preview/react";

import type { CfFetchById, Nested } from "@aces/types";

import { CfAccordions } from "./render";
import { fetchAccordionsData } from "./services";
import { AccordionsSkeleton } from "./skeleton";

export interface CfAccordionsClientProps extends CfFetchById, Nested {}

export const CfAccordionsClient = ({
  id,
  preview,
  lang,
  nested,
}: CfAccordionsClientProps) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAccordionsData(id, preview, lang)
      .then(setData)
      .catch((err) => {
        console.error("Client fetch failed:", err);
      });
  }, [id, preview, lang]);

  const updatedData = useContentfulLiveUpdates(data);

  if (!updatedData) return <AccordionsSkeleton />;

  return (
    <CfAccordions
      internalTitle={updatedData.internalTitle}
      hideOnDesktop={updatedData.hideOnDesktop}
      defaultOpen={updatedData.defaultOpen}
      accordionsCollection={updatedData.accordionsCollection}
      __typename={updatedData.__typename}
      nested={nested}
      id={id}
      lang={lang}
      preview={preview}
    />
  );
};
