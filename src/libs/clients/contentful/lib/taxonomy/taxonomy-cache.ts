import { defaultLocale } from "@aces/i18n";
import { slugify } from "@aces/utils";
import {
  ConceptScheme,
  Taxonomy,
  TaxonomyConcept,
  TaxonomyConceptNode,
  TaxonomyFacet,
} from "@aces/types";

// Imported by path, not through `@aces/features`: that barrel pulls in feature
// components which import `@aces/contentful`, and the cycle breaks the build.
import { KnowledgeTaxonomySchemes } from "../../../../features/config";
import { fetchConcepts, fetchConceptSchemes } from "./services";

/**
 * URL slug for a concept, derived from its label.
 *
 * Contentful taxonomy concepts have no slug field, and their ids are
 * scheme-prefixed (`sfkb-invoices`), so the label is the only thing that makes
 * a readable URL. Resolution is done by comparing slugs, never by trusting the
 * URL to be an id.
 */
export const conceptSlug = (concept: { label: string; id: string }): string =>
  slugify(concept.label) || concept.id;

/** Reverse of `conceptSlug`; also accepts a raw concept id. */
export const findConceptBySlug = (
  taxonomy: Taxonomy,
  slug: string,
): TaxonomyConcept | null => {
  const wanted = slug.toLowerCase();

  for (const concept of Object.values(taxonomy.conceptsById)) {
    if (conceptSlug(concept) === wanted || concept.id.toLowerCase() === wanted) {
      return concept;
    }
  }

  return null;
};

/**
 * Assembles the concept dictionary the rest of the app joins against.
 *
 * The underlying `fetch` calls are tagged `taxonomy`, so Next's data cache holds
 * them and `/api/revalidate` can bust them without a redeploy.
 */
export const getTaxonomy = async (
  preview = false,
  locale = defaultLocale,
): Promise<Taxonomy> => {
  const allSchemes = await fetchConceptSchemes(preview, locale);

  // Empty config means "whatever schemes exist" — useful while the KB taxonomy
  // is still being authored, but pin it in config once the scheme is settled.
  const schemes = KnowledgeTaxonomySchemes.length
    ? allSchemes.filter((s) => KnowledgeTaxonomySchemes.includes(s.id))
    : allSchemes;

  // Fetch per scheme rather than listing every concept: the unfiltered CDA
  // listing returns an empty `conceptSchemes` array, so scheme membership is
  // only reliable when the request is scoped to a scheme.
  const perScheme = await Promise.all(
    schemes.map(async (scheme) => ({
      scheme,
      concepts: await fetchConcepts(scheme.id, preview, locale),
    })),
  );

  const conceptsById: Record<string, TaxonomyConcept> = {};
  const childrenByParent: Record<string, string[]> = {};

  for (const { scheme, concepts } of perScheme) {
    for (const concept of concepts) {
      // A concept can sit in more than one scheme; merge rather than overwrite.
      const existing = conceptsById[concept.id];
      conceptsById[concept.id] = existing
        ? { ...concept, schemes: [...new Set([...existing.schemes, scheme.id])] }
        : { ...concept, schemes: [...new Set([...concept.schemes, scheme.id])] };
    }
  }

  for (const concept of Object.values(conceptsById)) {
    for (const parent of concept.broader) {
      (childrenByParent[parent] ??= []).push(concept.id);
    }
  }

  return { schemes, conceptsById, childrenByParent };
};

/** Resolves one scheme into a tree. Guards against `broader` cycles. */
export const buildConceptTree = (
  taxonomy: Taxonomy,
  scheme: ConceptScheme,
): TaxonomyConceptNode[] => {
  const inScheme = (id: string) => taxonomy.conceptsById[id]?.schemes.includes(scheme.id);

  const build = (id: string, seen: Set<string>): TaxonomyConceptNode | null => {
    const concept = taxonomy.conceptsById[id];
    if (!concept || seen.has(id)) return null;

    const next = new Set(seen).add(id);
    const children = (taxonomy.childrenByParent[id] ?? [])
      .filter(inScheme)
      .map((childId) => build(childId, next))
      .filter((node): node is TaxonomyConceptNode => node !== null);

    return { ...concept, children };
  };

  // Prefer the scheme's declared roots; fall back to concepts with no parent
  // inside this scheme, so a scheme without `topConcepts` still renders.
  const roots = scheme.topConcepts.length
    ? scheme.topConcepts.filter(inScheme)
    : Object.values(taxonomy.conceptsById)
        .filter((c) => c.schemes.includes(scheme.id))
        .filter((c) => !c.broader.some(inScheme))
        .map((c) => c.id);

  return roots
    .map((id) => build(id, new Set()))
    .filter((node): node is TaxonomyConceptNode => node !== null);
};

/** One facet group per configured scheme, ready for the filter sidebar. */
export const getTaxonomyFacets = async (
  preview = false,
  locale = defaultLocale,
): Promise<TaxonomyFacet[]> => {
  const taxonomy = await getTaxonomy(preview, locale);

  return taxonomy.schemes.map((scheme) => ({
    scheme,
    tree: buildConceptTree(taxonomy, scheme),
  }));
};
