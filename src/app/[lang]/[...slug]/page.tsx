import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

import { defaultLocale, locales } from "@aces/i18n";
import { CatchAllPageProps } from "@aces/types";
import { sliceSlug, specialtyPageRedirect } from "@aces/utils";
import { fetchPageData } from "@aces/contentful";
import {
  buildMetadata,
  DefaultPageBody,
  PagePreviewClient,
} from "@aces/features";

/**
 * `/api/<anything-unrouted>` reaches this catch-all with `lang` bound to
 * "api", because middleware deliberately skips `/api`. Passing that to
 * Contentful as a locale returns a null payload, which used to be
 * dereferenced and surface as a 500 on what is really a 404.
 */
const isSupportedLocale = (lang: string) =>
  locales.some((entry) => entry.locale === lang);

export async function generateMetadata({
  params,
}: {
  params: Promise<CatchAllPageProps>;
}): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);

  if (!isSupportedLocale(resolvedParams.lang)) {
    notFound();
  }

  const { isEnabled } = await draftMode();
  const { slug } = resolvedParams;

  const pageData = await fetchPageData(sliceSlug(slug), isEnabled);
  const pageResponse = pageData.pageResponse.data.pageCollection.items[0];

  if (!pageResponse) {
    notFound();
  }

  if (!pageResponse.seo) return {};

  return await buildMetadata(pageResponse.seo, {});
}

export default async function Page({
  params,
}: {
  params: Promise<CatchAllPageProps>;
}) {
  const resolvedParams = await Promise.resolve(params);

  if (!isSupportedLocale(resolvedParams.lang)) {
    notFound();
  }

  const { isEnabled } = await draftMode();
  const { lang = defaultLocale, slug } = resolvedParams;

  const pageData = await fetchPageData(sliceSlug(slug), isEnabled, lang);
  const pageResponse = pageData.pageResponse.data.pageCollection.items[0];

  if (!pageResponse) {
    notFound();
  }

  specialtyPageRedirect(pageResponse.specialtyPage);

  if (isEnabled) {
    return <PagePreviewClient slug={sliceSlug(slug)} />;
  }

  const pageBodyResponse =
    pageData.pageBodyResponse.data.page.pageBodyCollection.items;

  return (
    <DefaultPageBody items={pageBodyResponse} preview={isEnabled} lang={lang} />
  );
}
