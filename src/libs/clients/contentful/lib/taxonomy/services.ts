import { defaultLocale } from "@aces/i18n";
import { ConceptScheme, TaxonomyConcept } from "@aces/types";

/**
 * Taxonomy lives on the CDA REST API, not GraphQL — `TaxonomyConcept` in the
 * GraphQL schema exposes `id` and nothing else, so concept labels and hierarchy
 * are unavailable there. These use plain `fetch` (not Apollo) so Next's data
 * cache can hold them under the `taxonomy` tag.
 */

const CDA_URL = process.env.NEXT_PUBLIC_CF_CDA_URL ?? "https://cdn.contentful.com";
const CPA_URL = process.env.NEXT_PUBLIC_CF_CPA_URL ?? "https://preview.contentful.com";

export const TAXONOMY_CACHE_TAG = "taxonomy";

const base = (preview: boolean) =>
  `${preview ? CPA_URL : CDA_URL}/spaces/${process.env.NEXT_PUBLIC_CF_SPACE}` +
  `/environments/${process.env.NEXT_PUBLIC_CF_ENVIRONMENT}`;

const token = (preview: boolean) =>
  preview
    ? process.env.NEXT_PUBLIC_CF_PREVIEW_ACCESS_TOKEN
    : process.env.NEXT_PUBLIC_CF_ACCESS_TOKEN;

/** Contentful returns localized fields as `{ "en-US": value }`. */
type LocalizedString = Record<string, string> | null | undefined;

const localized = (value: LocalizedString, locale: string): string | undefined => {
  if (!value) return undefined;
  return value[locale] ?? value[defaultLocale] ?? Object.values(value)[0];
};

const ids = (links?: { sys: { id: string } }[]): string[] =>
  (links ?? []).map((l) => l.sys.id);

interface CdaCollection<T> {
  items: T[];
  /** Cursor pagination — `next` is a path, already carrying the query string. */
  pages?: { next?: string };
}

/**
 * Follows `pages.next` until exhausted. Taxonomies are small, but a scheme with
 * a few hundred concepts will page, and a truncated facet list is a silent bug.
 */
async function fetchAll<T>(path: string, preview: boolean): Promise<T[]> {
  const host = preview ? CPA_URL : CDA_URL;
  let url: string | undefined = `${base(preview)}${path}`;
  const out: T[] = [];

  while (url) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token(preview)}` },
      next: { tags: [TAXONOMY_CACHE_TAG] },
    });

    if (!response.ok) {
      throw new Error(
        `Contentful taxonomy request failed (${response.status}): ${path}`,
      );
    }

    const body: CdaCollection<T> = await response.json();
    out.push(...body.items);
    url = body.pages?.next ? `${host}${body.pages.next}` : undefined;
  }

  return out;
}

interface RawScheme {
  sys: { id: string };
  prefLabel?: LocalizedString;
  definition?: LocalizedString;
  topConcepts?: { sys: { id: string } }[];
}

interface RawConcept {
  sys: { id: string };
  prefLabel?: LocalizedString;
  definition?: LocalizedString;
  broader?: { sys: { id: string } }[];
  related?: { sys: { id: string } }[];
  conceptSchemes?: { sys: { id: string } }[];
}

export const fetchConceptSchemes = async (
  preview = false,
  locale = defaultLocale,
): Promise<ConceptScheme[]> => {
  // Note the hyphen: `concept_schemes` with an underscore 404s on the CDA.
  const raw = await fetchAll<RawScheme>("/taxonomy/concept-schemes?limit=100", preview);

  return raw.map((s) => ({
    id: s.sys.id,
    label: localized(s.prefLabel, locale) ?? s.sys.id,
    definition: localized(s.definition, locale),
    topConcepts: ids(s.topConcepts),
  }));
};

export const fetchConcepts = async (
  schemeId?: string,
  preview = false,
  locale = defaultLocale,
): Promise<TaxonomyConcept[]> => {
  const scope = schemeId ? `&conceptScheme=${encodeURIComponent(schemeId)}` : "";
  const raw = await fetchAll<RawConcept>(`/taxonomy/concepts?limit=200${scope}`, preview);

  return raw.map((c) => ({
    id: c.sys.id,
    label: localized(c.prefLabel, locale) ?? c.sys.id,
    definition: localized(c.definition, locale),
    broader: ids(c.broader),
    related: ids(c.related),
    schemes: ids(c.conceptSchemes),
  }));
};
