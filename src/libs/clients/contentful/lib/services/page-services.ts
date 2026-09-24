import { defaultLocale, Locale } from "@aces/i18n";

import { cfClient, cfPreviewClient } from "../client";
import {
  DefaultPageBodyQuery,
  PageQuery,
  SpecialtyPageQuery,
} from "../queries/page-queries";

export const fetchPageSysData = async (
  slug: string,
  preview = false,
  locale: Locale = defaultLocale,
) => {
  const client = preview ? cfPreviewClient : cfClient;
  try {
    const pageResponse = await client.query({
      query: PageQuery,
      variables: { slug, preview, locale },
    });

    return pageResponse;
  } catch (error) {
    console.error("Error fetching page data:", error);
    throw error;
  }
};

export const fetchPageData = async (
  slug: string,
  preview = false,
  locale: Locale = defaultLocale,
) => {
  const client = preview ? cfPreviewClient : cfClient;

  try {
    const pageResponse = await client.query({
      query: PageQuery,
      variables: { slug, preview, locale },
    });

    if (!pageResponse.data.pageCollection.items.length) {
      return {
        pageResponse: { data: { pageCollection: { items: [] } } },
        pageBodyResponse: {
          data: { page: { pageBodyCollection: { items: [] } } },
        },
      };
    }

    const id = pageResponse.data.pageCollection.items[0].sys.id;

    const pageBodyResponse = await client.query({
      query: DefaultPageBodyQuery,
      variables: { id, preview, locale },
    });

    return { pageResponse, pageBodyResponse };
  } catch (error) {
    console.error("Error fetching page data:", error);
    throw error;
  }
};

export const fetchPageDataPreview = async (
  slug: string,
  locale: Locale = defaultLocale,
) => {
  try {
    const pageResponse = await cfPreviewClient.query({
      query: PageQuery,
      variables: { slug, preview: true, locale },
    });

    const items = pageResponse.data.pageCollection.items;
    if (!items.length) {
      return { pageEntry: null, pageBodyResponse: null };
    }

    const pageEntry = items[0];
    const id = pageEntry.sys.id;

    const pageBodyResponse = await cfPreviewClient.query({
      query: DefaultPageBodyQuery,
      variables: { id, preview: true, locale },
    });

    const mergedPageEntry = {
      ...pageEntry,
      pageBodyCollection: pageBodyResponse.data.page.pageBodyCollection,
    };

    return { pageEntry: mergedPageEntry, pageBodyResponse };
  } catch (error) {
    console.error("Error fetching page preview data:", error);
    throw error;
  }
};

export const fetchSpecialtyPageData = async (
  specialtyPage: string,
  preview = false,
  locale: Locale = defaultLocale,
) => {
  const client = preview ? cfPreviewClient : cfClient;
  try {
    const pageResponse = await client.query({
      query: SpecialtyPageQuery,
      variables: { specialtyPage, preview, locale },
    });

    if (!pageResponse.data.pageCollection.items.length) {
      return {
        pageResponse: { data: { pageCollection: { items: [] } } },
        pageBodyResponse: {
          data: { page: { pageBodyCollection: { items: [] } } },
        },
      };
    }

    const id = pageResponse.data.pageCollection.items[0].sys.id;

    const pageBodyResponse = await client.query({
      query: DefaultPageBodyQuery,
      variables: { id, preview, locale },
    });

    return { pageResponse, pageBodyResponse };
  } catch (error) {
    console.error("Error fetching page data:", error);
    throw error;
  }
};
