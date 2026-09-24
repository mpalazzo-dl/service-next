import { gql } from "@apollo/client";

import {
  ButtonFragment,
  ImageFragment,
  cfClient,
  cfPreviewClient,
} from "@aces/contentful";
import { defaultLocale } from "@aces/i18n";

import { CardFragment } from "../cf-card/services";

export const CollectionQuery = gql`
  ${ImageFragment}
  ${ButtonFragment}
  ${CardFragment}

  query ($id: String!, $preview: Boolean!, $locale: String) {
    collection(id: $id, preview: $preview, locale: $locale) {
      internalTitle
      display
      itemsCollection(limit: 12) {
        items {
          ...Card
        }
      }
      sys {
        id
      }
      __typename
    }
  }
`;

export const fetchCollectionData = async (
  id: string,
  preview = false,
  locale: string = defaultLocale,
) => {
  const client = preview ? cfPreviewClient : cfClient;
  try {
    const response = await client.query({
      query: CollectionQuery,
      variables: { id, preview, locale },
    });

    return response.data.collection;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};
