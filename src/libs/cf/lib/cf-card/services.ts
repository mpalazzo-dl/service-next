import { gql } from "@apollo/client";

import {
  ButtonFragment,
  ImageFragment,
  cfClient,
  cfPreviewClient,
} from "@aces/contentful";
import { defaultLocale } from "@aces/i18n";

export const CardFragment = gql`
  fragment Card on Card {
    internalTitle
    image {
      ...Image
    }
    cardBody {
      json
    }
    buttonsCollection(limit: 3) {
      items {
        ...Button
      }
    }
    sys {
      id
    }
    __typename
  }
`;

export const CardQuery = gql`
  ${ImageFragment}
  ${ButtonFragment}
  ${CardFragment}

  query ($id: String!, $preview: Boolean!, $locale: String) {
    card(id: $id, preview: $preview, locale: $locale) {
      ...Card
    }
  }
`;

export const fetchCardData = async (
  id: string,
  preview = false,
  locale: string = defaultLocale,
) => {
  const client = preview ? cfPreviewClient : cfClient;
  try {
    const response = await client.query({
      query: CardQuery,
      variables: { id, preview, locale },
    });

    return response.data.card;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};
