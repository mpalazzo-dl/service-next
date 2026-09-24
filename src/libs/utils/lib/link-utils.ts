import {
  ArticleTarget,
  CfLinkReference,
  CfLinkTarget,
  LinkTarget,
  PageTarget,
  ResolvedLink,
  RouteDirectory,
  SpecialtyPages,
} from "@aces/types";

/**
 * Canonical path for an article, walking `parentArticle` outward.
 *
 * The chain arrives already flattened by the query's fixed-depth selection set,
 * so this only has to reverse it.
 */
export const buildArticlePath = (article: ArticleTarget): string => {
  const segments: string[] = [article.slug];

  let parent = article.parentArticle;
  while (parent) {
    segments.unshift(parent.slug);
    parent = parent.parentArticle ?? undefined;
  }

  return `${RouteDirectory.Articles}/${segments.join("/")}`;
};

/** Canonical path for a page, walking `parentPage` outward. */
export const buildPagePath = (page: PageTarget): string => {
  if (page.specialtyPage === SpecialtyPages.Homepage) {
    return RouteDirectory.Homepage;
  }

  if (page.specialtyPage === SpecialtyPages.KnowledgeHome) {
    return RouteDirectory.Articles;
  }

  const segments: string[] = [page.slug];

  let parent = page.parentPage;
  while (parent) {
    segments.unshift(parent.slug);
    parent = parent.parentPage ?? undefined;
  }

  return `/${segments.join("/")}`;
};

/** Path for any internal link target. */
export const buildTargetPath = (target: LinkTarget): string => {
  switch (target.__typename) {
    case "Page":
      return buildPagePath(target);
    case "Article":
      return buildArticlePath(target);
    case "PdfDocument":
      return `${RouteDirectory.PDF}/${target.slug}`;
    default:
      return "#";
  }
};

/** Protocol-relative and absolute URLs leave the site; a path does not. */
const isAbsoluteUrl = (url: string) => /^(https?:)?\/\//i.test(url.trim());

const FALLBACK: ResolvedLink = {
  href: "#",
  target: "_self",
  isExternal: false,
};

/**
 * Resolves either flavour of link reference to an href.
 *
 * `isExternal` comes from the reference's own type, which is why the authored
 * `externalLinkIcon` booleans were removed from the model — a `Link` can never
 * claim to be external, and an `ExternalLink` can never claim not to be.
 */
export const resolveLinkHref = (
  reference?: CfLinkReference | null,
): ResolvedLink => {
  if (!reference) return FALLBACK;

  const target: CfLinkTarget = reference.target ?? "_self";

  if (reference.__typename === "ExternalLink") {
    if (!reference.url) return { ...FALLBACK, target };

    // An ExternalLink can legitimately hold a same-origin path (a route with
    // no entry behind it, such as /topics/intent). "External" should mean
    // "leaves this site", which is what the icon tells a reader — so it is
    // decided by the URL, not only by the content type.
    return {
      href: reference.url,
      target,
      isExternal: isAbsoluteUrl(reference.url),
    };
  }

  if (reference.__typename === "Link" && reference.link) {
    return { href: buildTargetPath(reference.link), target, isExternal: false };
  }

  return { ...FALLBACK, target };
};

export const isExternalReference = (
  reference?: CfLinkReference | null,
): boolean => resolveLinkHref(reference).isExternal;
