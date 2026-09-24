import type { CfFetchById } from "@aces/types";

import { CfCollection } from "./render";
import { fetchCollectionData } from "./services";
import { CollectionSkeleton } from "./skeleton";

export const CfCollectionServer = async ({ id, preview, lang }: CfFetchById) => {
  let data;

  try {
    data = await fetchCollectionData(id, preview, lang);
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return <CollectionSkeleton />;
  }

  if (!data) {
    return <CollectionSkeleton />;
  }

  return (
    <CfCollection
      internalTitle={data.internalTitle}
      display={data.display}
      itemsCollection={data.itemsCollection}
      __typename={data.__typename}
      id={id}
      lang={lang}
      preview={preview}
    />
  );
};
