import { Locale } from "@aces/i18n";

/** Owned here rather than in cf-types, which imports from this module. */
export type CfLinkTarget = "_self" | "_blank";

export interface CatchAllPageProps {
  lang: Locale;
  slug: string[];
}

export interface PageProps {
  lang: Locale;
  slug: string;
}

export enum SpecialtyPages {
  Homepage = "Homepage",
  KnowledgeHome = "Knowledge Home",
}

export enum RouteDirectory {
  Homepage = "/",
  Articles = "/articles",
  /** Per-concept category listing, e.g. /topics/invoices */
  Topics = "/topics",
  Search = "/search",
  PDF = "/api/pdf",
}

export type PageLinkTypes = "Page" | "Article" | "PdfDocument";

/**
 * Parent chains are a fixed-depth selection set, not recursion — GraphQL has no
 * recursive fragments. Depth here must match `ArticleTreeMaxDepth` in the
 * feature config and the selection set in the link fragments.
 */
export interface PageTarget {
  __typename: "Page";
  slug: string;
  specialtyPage?: SpecialtyPages;
  parentPage?: {
    slug: string;
    parentPage?: { slug: string } | null;
  } | null;
}

export interface ArticleTarget {
  __typename: "Article";
  slug: string;
  parentArticle?: {
    slug: string;
    parentArticle?: { slug: string } | null;
  } | null;
}

export interface PdfTarget {
  __typename: "PdfDocument";
  slug: string;
}

export type LinkTarget = PageTarget | ArticleTarget | PdfTarget;

/** Kept for components that still take a bare page reference. */
export type PageLinkProps = LinkTarget;

/**
 * `link` and `externalLink` are deliberately separate content types.
 * Nothing authors an "is external" flag — it is derived from which of these two
 * a reference resolves to, so the two can never disagree.
 */
export interface CfInternalLink {
  __typename: "Link";
  internalTitle?: string;
  link?: LinkTarget | null;
  target?: CfLinkTarget;
  sys?: { id: string };
}

export interface CfExternalLink {
  __typename: "ExternalLink";
  internalTitle?: string;
  /** A plain URL string, not an entry reference. Aliased in the fragment. */
  url?: string | null;
  target?: CfLinkTarget;
  sys?: { id: string };
}

export type CfLinkReference = CfInternalLink | CfExternalLink;

export interface ResolvedLink {
  href: string;
  target: CfLinkTarget;
  isExternal: boolean;
}
