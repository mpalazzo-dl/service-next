import type { CfFetchById } from "@aces/types";

import { CfInfoPanel } from "./render";
import { fetchInfoPanelData } from "./services";
import { InfoPanelSkeleton } from "./skeleton";

export const CfInfoPanelServer = async ({ id, preview, lang }: CfFetchById) => {
  let data;

  try {
    data = await fetchInfoPanelData(id, preview, lang);
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return <InfoPanelSkeleton />;
  }

  if (!data) {
    return <InfoPanelSkeleton />;
  }

  return (
    <CfInfoPanel
      internalTitle={data.internalTitle}
      type={data.type}
      text={data.text}
      __typename={data.__typename}
      id={id}
      lang={lang}
      preview={preview}
    />
  );
};
