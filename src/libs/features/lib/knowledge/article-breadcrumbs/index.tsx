import NextLink from "next/link";

import { ArticleTarget, RouteDirectory } from "@aces/types";
import { buildArticlePath } from "@aces/utils";
import { Breadcrumbs, Text } from "@aces/ui";

interface ArticleBreadcrumbsProps {
  article: ArticleTarget & { title: string };
  homeLabel?: string;
  rootLabel?: string;
}

/**
 * Built from the `parentArticle` chain the detail query already returns, so it
 * costs no extra request. The chain arrives innermost-first; walking it
 * outward and reversing gives ancestor order.
 */
export const ArticleBreadcrumbs = ({
  article,
  homeLabel = "Home",
  rootLabel = "Knowledge Base",
}: ArticleBreadcrumbsProps) => {
  const ancestors: { slug: string; path: string }[] = [];

  let parent = article.parentArticle;
  const chain: { slug: string; parentArticle?: { slug: string } | null }[] = [];
  while (parent) {
    chain.unshift(parent);
    parent = parent.parentArticle ?? undefined;
  }

  chain.forEach((node, index) => {
    const slugs = chain.slice(0, index + 1).map((n) => n.slug);
    ancestors.push({
      slug: node.slug,
      path: `${RouteDirectory.Articles}/${slugs.join("/")}`,
    });
  });

  return (
    <Breadcrumbs aria-label="breadcrumb">
      <NextLink href={RouteDirectory.Homepage}>{homeLabel}</NextLink>
      <NextLink href={RouteDirectory.Articles}>{rootLabel}</NextLink>
      {ancestors.map((ancestor) => (
        <NextLink key={ancestor.path} href={ancestor.path}>
          {/* Ancestor titles are not in the parent chain selection set, so the
              slug stands in. Widening the fragment would cost a field per
              level on every card query that shares it. */}
          {ancestor.slug.replace(/-/g, " ")}
        </NextLink>
      ))}
      <Text component="span" aria-current="page">
        {article.title}
      </Text>
    </Breadcrumbs>
  );
};
