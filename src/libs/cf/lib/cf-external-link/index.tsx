import type { CfFetchById } from "@aces/types";

import { CfLink } from "../cf-link/render";
import { LinkSkeleton } from "../cf-link/skeleton";
import { fetchExternalLinkData } from "./services";

export interface CfExternalLinkServerProps extends CfFetchById {
  children?: React.ReactNode;
}

/**
 * Sibling of `CfLinkServer` for the `externalLink` content type. Both render
 * through the same `BaseLink`, which derives the external icon and `rel` from
 * the reference's `__typename`.
 */
export const CfExternalLinkServer = async ({
  id,
  preview,
  lang,
  children,
}: CfExternalLinkServerProps) => {
  let data;

  try {
    data = await fetchExternalLinkData(id, preview, lang);
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return <LinkSkeleton />;
  }

  if (!data) {
    return <LinkSkeleton />;
  }

  return (
    <CfLink reference={data} lang={lang}>
      {children}
    </CfLink>
  );
};
