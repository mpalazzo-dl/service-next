import type { MetadataRoute } from "next";

import {
  conceptSlug,
  fetchArticlePaths,
  getTaxonomy,
} from "@aces/contentful";
import { buildArticlePath } from "@aces/utils";

/**
 * The sitemap defines the search index's scope.
 *
 * Salesforce's Web Content (Sitemap) connector reads exactly this list to
 * build the Data 360 index — a page that is not here is invisible to search,
 * and nothing outside it gets indexed. Generating it from Contentful keeps the
 * two in step without anyone maintaining a list.
 */
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  try {
    const [articles, taxonomy] = await Promise.all([
      fetchArticlePaths(),
      getTaxonomy(),
    ]);

    // Category pages are indexable landing pages in their own right, so they
    // belong in the crawl scope alongside the articles.
    const topics = Object.values(taxonomy.conceptsById).map((concept) => ({
      url: `${base}/topics/${conceptSlug(concept)}`,
      lastModified: new Date(),
    }));

    return [
      { url: `${base}/`, lastModified: new Date() },
      { url: `${base}/articles`, lastModified: new Date() },
      ...topics,
      ...articles.map((article: any) => ({
        url: `${base}${buildArticlePath({ ...article, __typename: "Article" })}`,
        lastModified: new Date(),
      })),
    ];
  } catch (error) {
    // A sitemap that 500s takes the whole index down on the next crawl.
    console.error("Could not build sitemap from Contentful:", error);
    return [{ url: `${base}/`, lastModified: new Date() }];
  }
}
