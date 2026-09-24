import {
  CfAccordionsServer,
  CfBannerServer,
  CfCollectionServer,
  CfImageServer,
  CfLockupServer,
  CfRichTextSectionServer,
  CfVideoEmbedServer,
} from "@aces/cf";

import { PageBodyProps } from "./page-body-types";

/**
 * Keys are GraphQL `__typename`s, so they must match the types allowed on
 * `page.pageBody` in Contentful. An entry of any other type renders nothing
 * rather than throwing — the model can legitimately be ahead of the code.
 */
const PAGE_BODY_COMPONENTS = {
  Accordions: CfAccordionsServer,
  Banner: CfBannerServer,
  Collection: CfCollectionServer,
  Image: CfImageServer,
  Lockup: CfLockupServer,
  RichTextSection: CfRichTextSectionServer,
  VideoEmbed: CfVideoEmbedServer,
} as const;

export const DefaultPageBody = ({ items, preview, lang }: PageBodyProps) => {
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
            key={item?.sys?.id || index}
          />
        );
      })}
    </>
  );
};
