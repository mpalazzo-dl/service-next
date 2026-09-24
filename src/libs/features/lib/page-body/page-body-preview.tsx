"use client";

import {
  CfAccordionsClient,
  CfBannerClient,
  CfCollectionClient,
  CfImageClient,
  CfLockupClient,
  CfRichTextSectionClient,
  CfVideoEmbedClient,
} from "@aces/cf";
import { generateId } from "@aces/utils";

import { PageBodyProps } from "./page-body-types";

/** Live-preview twin of PAGE_BODY_COMPONENTS — keep the two key sets in sync. */
const PAGE_BODY_COMPONENTS = {
  Accordions: CfAccordionsClient,
  Banner: CfBannerClient,
  Collection: CfCollectionClient,
  Image: CfImageClient,
  Lockup: CfLockupClient,
  RichTextSection: CfRichTextSectionClient,
  VideoEmbed: CfVideoEmbedClient,
} as const;

export const PreviewPageBody = ({ items, preview, lang }: PageBodyProps) => {
  if (!items) {
    return null;
  }

  return (
    <>
      {items.map((item, index) => {
        const Component =
          PAGE_BODY_COMPONENTS[
            item.__typename as keyof typeof PAGE_BODY_COMPONENTS
          ];

        if (!Component) {
          return null;
        }

        return (
          <Component
            id={item?.sys?.id || ""}
            preview={preview}
            lang={lang}
            key={generateId(`${item?.sys?.id ?? "no-id"}-${index}`)}
          />
        );
      })}
    </>
  );
};
