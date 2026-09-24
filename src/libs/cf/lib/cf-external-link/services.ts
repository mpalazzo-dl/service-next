import { gql } from "@apollo/client";

import { ExternalLinkFragment, cfClient, cfPreviewClient } from "@aces/contentful";
import { defaultLocale } from "@aces/i18n";

export const ExternalLinkQuery = gql`
  ${ExternalLinkFragment}

  query ($id: String!, $preview: Boolean!, $locale: String) {
    externalLink(id: $id, preview: $preview, locale: $locale) {
      ...ExternalLink
    }
  }
`;

export const fetchExternalLinkData = async (
  id: string,
  preview = false,
  locale: string = defaultLocale,
) => {
  const client = preview ? cfPreviewClient : cfClient;
  try {
    const response = await client.query({
      query: ExternalLinkQuery,
      variables: { id, preview, locale },
    });

    return response.data.externalLink;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};
