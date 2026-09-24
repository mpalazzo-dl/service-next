import { gql } from "@apollo/client";

import { cfClient, cfPreviewClient, ImageFragment } from "@aces/contentful";
import { defaultLocale } from "@aces/i18n";

export const AccordionsQuery = gql`
  ${ImageFragment}

  query ($id: String!, $preview: Boolean!, $locale: String) {
    accordions(id: $id, preview: $preview, locale: $locale) {
      internalTitle
      hideOnDesktop
      defaultOpen
      accordionsCollection {
        items {
          internalTitle
          icon {
            ...Image
          }
          headline
          bodyCopy {
            json
          }
          sys {
            id
          }
        }
      }
      sys {
        id
      }
    }
  }
`;

export const fetchAccordionsData = async (
  id: string,
  preview = false,
  locale: string = defaultLocale,
) => {
  const client = preview ? cfPreviewClient : cfClient;
  try {
    const response = await client.query({
      query: AccordionsQuery,
      variables: { id, preview, locale },
    });

    return response.data.accordions;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};
