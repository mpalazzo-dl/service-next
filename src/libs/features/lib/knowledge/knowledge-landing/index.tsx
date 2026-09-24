import { TaxonomyFacet } from "@aces/types";
import { Container } from "@aces/ui";

import { KbHero } from "../kb-hero";
import { TaxonomyBrowse } from "../taxonomy-browse";

interface KnowledgeLandingProps {
  facets: TaxonomyFacet[];
  title: string;
  subtitle?: string;
  placeholder?: string;
  popularLabel?: string;
  popularSearches?: string[];
  browseTitle?: string;
}

/**
 * The default knowledge-base landing: search, then browse.
 *
 * Deliberately has no article list — someone arriving at the front door either
 * knows what to ask or wants to pick a category, and a list of every article
 * helps with neither.
 */
export const KnowledgeLanding = ({
  facets,
  title,
  subtitle,
  placeholder,
  popularLabel,
  popularSearches = [],
  browseTitle = "Browse by product",
}: KnowledgeLandingProps) => {
  return (
    <>
      <KbHero
        title={title}
        subtitle={subtitle}
        placeholder={placeholder}
        popularLabel={popularLabel}
        popularSearches={popularSearches}
      />

      <Container maxWidth="lg">
        <TaxonomyBrowse facets={facets} title={browseTitle} />
      </Container>
    </>
  );
};
