import type { Metadata } from "next";
import { draftMode } from "next/headers";

import { defaultLocale, getLocale } from "@aces/i18n";
import { PageProps, SpecialtyPages } from "@aces/types";
import { fetchSpecialtyPageData, getTaxonomyFacets } from "@aces/contentful";
import {
  buildMetadata,
  DefaultPageBody,
  KnowledgeLanding,
  PagePreviewClient,
} from "@aces/features";

/**
 * The homepage is the knowledge-base landing by default — search, then browse
 * by category.
 *
 * Authoring a `page` entry with `specialtyPage: Homepage` overrides it
 * entirely and renders that page's body instead, so the built-in landing is a
 * sensible default rather than something you have to delete to get past.
 */
const loadHomepage = async (preview: boolean, lang: string) => {
  const pageData = await fetchSpecialtyPageData(
    SpecialtyPages.Homepage,
    preview,
    lang,
  );

  return pageData.pageResponse.data.pageCollection.items[0] ?? null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<PageProps>;
}): Promise<Metadata> {
  const { lang = defaultLocale } = await Promise.resolve(params);
  const { isEnabled } = await draftMode();

  const page = await loadHomepage(isEnabled, lang);

  if (page?.seo) {
    return await buildMetadata(page.seo, {});
  }

  const t = await getLocale(lang, "seo");

  return await buildMetadata(
    {
      title: t?.articles?.title ?? "Knowledge Center",
      description: t?.articles?.description ?? "",
    },
    {},
  );
}

export default async function Homepage({
  params,
}: {
  params: Promise<PageProps>;
}) {
  const { lang = defaultLocale } = await Promise.resolve(params);
  const { isEnabled } = await draftMode();

  const page = await loadHomepage(isEnabled, lang);

  if (page) {
    if (isEnabled) {
      return <PagePreviewClient slug={page.slug} />;
    }

    const pageData = await fetchSpecialtyPageData(
      SpecialtyPages.Homepage,
      isEnabled,
      lang,
    );

    return (
      <DefaultPageBody
        items={pageData.pageBodyResponse.data.page.pageBodyCollection.items}
        preview={isEnabled}
        lang={lang}
      />
    );
  }

  const [facets, t] = await Promise.all([
    getTaxonomyFacets(isEnabled, lang),
    getLocale(lang, "common"),
  ]);

  return (
    <KnowledgeLanding
      facets={facets}
      title={t.knowledge?.title ?? "Knowledge Base"}
      subtitle="Search our guides, how-tos and troubleshooting articles, or browse by product below."
      placeholder={t.knowledge?.searchPlaceholder ?? "Search for answers"}
      popularLabel={t.knowledge?.popularSearches ?? "Popular searches"}
      popularSearches={["salesforce sync", "credits", "intent score", "chrome extension"]}
    />
  );
}
