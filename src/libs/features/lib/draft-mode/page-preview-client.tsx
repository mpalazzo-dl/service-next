"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useContentfulLiveUpdates } from "@contentful/live-preview/react";

import { fetchPageDataPreview } from "@aces/contentful";

import { PreviewPageBody } from "../page-body";

export default function PagePreviewClient({ slug }: { slug: string }) {
  const [pageData, setPageData] = useState<any>(null);
  const params = useParams();
  let lang = params.lang || "en-US";

  if (Array.isArray(lang)) lang = lang[0];

  useEffect(() => {
    if (slug !== undefined) {
      fetchPageDataPreview(slug, lang).then(setPageData).catch(console.error);
    }
  }, [slug, lang]);

  const updatedPageEntry = useContentfulLiveUpdates(pageData?.pageEntry);
  const content = pageData
    ? {
        ...pageData,
        pageEntry: updatedPageEntry || pageData.pageEntry,
      }
    : null;

  if (!content || !content.pageEntry) return null;

  // The provider now lives in the root layout for all draft-mode routes, so
  // this component only subscribes — nesting a second provider would
  // initialise the SDK twice.
  return (
    <PreviewPageBody
      items={content.pageEntry.pageBodyCollection.items}
      preview
      lang={lang}
    />
  );
}
