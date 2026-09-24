/**
 * Contentful Taxonomy.
 *
 * GraphQL only ever returns `{ id }` for a concept on an entry, so labels and
 * hierarchy have to come from the CDA REST taxonomy endpoints and be joined on.
 * These types describe the joined result, not the raw REST payload.
 */

/** A concept as GraphQL returns it on `contentfulMetadata.concepts`. */
export interface CfConceptRef {
  id: string;
}

export interface TaxonomyConcept {
  id: string;
  label: string;
  definition?: string;
  /** Parent concept ids. Contentful allows more than one. */
  broader: string[];
  related: string[];
  /** Concept scheme ids this concept belongs to. */
  schemes: string[];
}

export interface TaxonomyConceptNode extends TaxonomyConcept {
  children: TaxonomyConceptNode[];
}

export interface ConceptScheme {
  id: string;
  label: string;
  definition?: string;
  /** Concept ids at the root of this scheme. */
  topConcepts: string[];
}

export interface Taxonomy {
  schemes: ConceptScheme[];
  conceptsById: Record<string, TaxonomyConcept>;
  /** Parent concept id -> child concept ids. */
  childrenByParent: Record<string, string[]>;
}

/** One scheme resolved into a tree, ready to render as a filter group. */
export interface TaxonomyFacet {
  scheme: ConceptScheme;
  tree: TaxonomyConceptNode[];
}
