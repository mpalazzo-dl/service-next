import type { CfFetchById } from "@aces/types";

import { CfLink } from "./render";
import { fetchLinkData } from "./services";
import { LinkSkeleton } from "./skeleton";

export interface CfLinkServerProps extends CfFetchById {
  children?: React.ReactNode;
}

export const CfLinkServer = async ({
  id,
  preview,
  lang,
  children,
}: CfLinkServerProps) => {
  let data;

  try {
    data = await fetchLinkData(id, preview, lang);
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
