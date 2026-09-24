"use client";

import { ContentfulLivePreviewProvider } from "@contentful/live-preview/react";

/**
 * Wraps the app in draft mode so the Contentful editor can talk to the page.
 *
 * The provider has to be in the React tree for either half of live preview to
 * work: inspector mode reads the `data-contentful-*` attributes the components
 * already emit, and live updates need a subscription to the editor's
 * postMessage channel. Previously it existed only inside the page-model
 * preview component, so every other route — the whole knowledge base — showed
 * draft content that never updated.
 */
export const LivePreviewProvider = ({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) => (
  <ContentfulLivePreviewProvider
    locale={locale}
    enableInspectorMode
    enableLiveUpdates
  >
    {children}
  </ContentfulLivePreviewProvider>
);
