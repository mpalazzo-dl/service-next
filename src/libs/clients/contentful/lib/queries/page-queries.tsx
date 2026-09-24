import { gql } from "@apollo/client";

export const MetadataFragment = gql`
  fragment Metadata on Metadata {
    title
    description
    socialTitle
    socialDescription
    socialImage {
      url
    }
    searchEngineVisibility
    searchIndex
    keywords
    schema
  }
`;

export const DefaultPageBodyQuery = gql`
  query ($id: String!, $preview: Boolean!, $locale: String) {
    page(id: $id, preview: $preview, locale: $locale) {
      pageBodyCollection {
        items {
          ... on Accordions {
            sys {
              id
            }
          }
          ... on Banner {
            sys {
              id
            }
          }
          ... on Collection {
            sys {
              id
            }
          }
          ... on Image {
            sys {
              id
            }
          }
          ... on Lockup {
            sys {
              id
            }
          }
          ... on RichTextSection {
            sys {
              id
            }
          }
          ... on VideoEmbed {
            sys {
              id
            }
          }
          __typename
        }
      }
    }
  }
`;


export const PageQuery = gql`
  ${MetadataFragment}

  query ($slug: String!, $preview: Boolean!, $locale: String) {
    pageCollection(
      where: { slug: $slug }
      limit: 1
      preview: $preview
      locale: $locale
    ) {
      items {
        title
        slug
        specialtyPage
        seo {
          ...Metadata
        }
        sys {
          id
        }
      }
    }
  }
`;

export const SpecialtyPageQuery = gql`
  ${MetadataFragment}

  query ($specialtyPage: String!, $preview: Boolean!, $locale: String) {
    pageCollection(
      where: { specialtyPage: $specialtyPage }
      limit: 1
      preview: $preview
      locale: $locale
    ) {
      items {
        title
        slug
        seo {
          ...Metadata
        }
        sys {
          id
        }
      }
    }
  }
`;
