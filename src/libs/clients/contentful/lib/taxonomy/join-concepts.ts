import { CfConceptRef, Taxonomy, TaxonomyConcept } from "@aces/types";

/**
 * GraphQL returns `contentfulMetadata.concepts` as bare `{ id }` objects.
 * Everything renderable — label, parents, scheme membership — has to be joined
 * on from the taxonomy dictionary.
 */

interface WithConcepts {
  contentfulMetadata?: { concepts?: (CfConceptRef | null)[] | null } | null;
}

/**
 * Resolves an entry's concept refs against the dictionary.
 *
 * Unknown ids are dropped rather than rendered as raw ids: a concept can be
 * deleted or moved out of a configured scheme while entries still reference it,
 * and showing `sfkb-login` to an end user is worse than showing nothing.
 */
export const joinConcepts = (
  entry: WithConcepts | null | undefined,
  taxonomy: Taxonomy,
): TaxonomyConcept[] => {
  const refs = entry?.contentfulMetadata?.concepts ?? [];

  return refs
    .map((ref) => (ref ? taxonomy.conceptsById[ref.id] : undefined))
    .filter((concept): concept is TaxonomyConcept => concept !== undefined);
};

/** Concepts on an entry that belong to one scheme — used for per-facet chips. */
export const joinConceptsForScheme = (
  entry: WithConcepts | null | undefined,
  taxonomy: Taxonomy,
  schemeId: string,
): TaxonomyConcept[] =>
  joinConcepts(entry, taxonomy).filter((c) => c.schemes.includes(schemeId));
