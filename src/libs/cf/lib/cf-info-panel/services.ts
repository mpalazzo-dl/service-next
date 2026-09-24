import { gql } from "@apollo/client";

import { cfClient, cfPreviewClient } from "@aces/contentful";
import { defaultLocale } from "@aces/i18n";

export const InfoPanelFragment = gql`
  fragment InfoPanel on InfoPanel {
    internalTitle
    type
    text {
      json
    }
    sys {
      id
    }
    __typename
  }
`;

export const InfoPanelQuery = gql`
  ${InfoPanelFragment}

  query ($id: String!, $preview: Boolean!, $locale: String) {
    infoPanel(id: $id, preview: $preview, locale: $locale) {
      ...InfoPanel
    }
  }
`;

export const fetchInfoPanelData = async (
  id: string,
  preview = false,
  locale: string = defaultLocale,
) => {
  const client = preview ? cfPreviewClient : cfClient;
  try {
    const response = await client.query({
      query: InfoPanelQuery,
      variables: { id, preview, locale },
    });

    return response.data.infoPanel;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};
