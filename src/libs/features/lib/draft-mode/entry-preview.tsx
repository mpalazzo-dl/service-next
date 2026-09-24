import { defaultLocale } from "@aces/i18n";
import {
  CfAccordionsServer,
  CfBannerServer,
  CfButtonServer,
  CfCardServer,
  CfCodeEmbedServer,
  CfCollectionServer,
  CfImageServer,
  CfInfoPanelServer,
  CfLinkTextServer,
  CfLockupServer,
  CfRichTextSectionServer,
  CfVideoEmbedServer,
} from "@aces/cf";

/**
 * Standalone preview for a single entry, reached from Contentful's preview URL.
 * Covers every renderable type in the model, not just the ones allowed in
 * `page.pageBody` — an editor can open a preview from any entry's sidebar.
 */
const PREVIEWABLE_COMPONENTS = {
  Accordions: CfAccordionsServer,
  Banner: CfBannerServer,
  Button: CfButtonServer,
  Card: CfCardServer,
  CodeEmbed: CfCodeEmbedServer,
  Collection: CfCollectionServer,
  Image: CfImageServer,
  InfoPanel: CfInfoPanelServer,
  LinkText: CfLinkTextServer,
  Lockup: CfLockupServer,
  RichTextSection: CfRichTextSectionServer,
  VideoEmbed: CfVideoEmbedServer,
} as const;

export const EntriesPreview = ({
  item,
  preview = true,
  lang = defaultLocale,
}: any) => {
  if (item === null) {
    return null;
  }

  const Component =
    PREVIEWABLE_COMPONENTS[
      item.__typename as keyof typeof PREVIEWABLE_COMPONENTS
    ];

  if (!Component) {
    return null;
  }

  return (
    <Component id={item?.sys?.id || ""} preview={preview} lang={lang} />
  );
};
