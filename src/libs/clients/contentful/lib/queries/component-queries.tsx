import { gql } from "@apollo/client";

export const EntryQuery = gql`
  query ($id: String!, $preview: Boolean!, $locale: String!) {
    entryCollection(
      where: { sys: { id: $id } }
      limit: 1
      preview: $preview
      locale: $locale
    ) {
      items {
        sys {
          id
        }
        __typename
      }
    }
  }
`;

export const PageLinkFragment = gql`
  fragment PageLink on Page {
    __typename
    slug
    specialtyPage
    parentPage {
      slug
      parentPage {
        slug
      }
    }
  }
`;

export const ArticleLinkFragment = gql`
  fragment ArticleLink on Article {
    __typename
    slug
    parentArticle {
      slug
      parentArticle {
        slug
      }
    }
  }
`;

export const PdfLinkFragment = gql`
  fragment PdfLink on PdfDocument {
    __typename
    slug
  }
`;

export const LinkFragment = gql`
  ${PageLinkFragment}
  ${ArticleLinkFragment}
  ${PdfLinkFragment}

  fragment Link on Link {
    __typename
    internalTitle
    link {
      ...PageLink
      ...ArticleLink
      ...PdfLink
    }
    target
    sys {
      id
    }
  }
`;

export const ExternalLinkFragment = gql`
  fragment ExternalLink on ExternalLink {
    __typename
    internalTitle
    # Aliased: Link.link returns an entry, ExternalLink.link a String, and
    # GraphQL rejects the same response key holding both.
    url: link
    target
    sys {
      id
    }
  }
`;

export const ModalIdFragment = gql`
  fragment Modal on Modal {
    __typename
    internalTitle
    sys {
      id
    }
  }
`;

export const ButtonFragment = gql`
  ${LinkFragment}
  ${ExternalLinkFragment}
  ${ModalIdFragment}

  fragment Button on Button {
    internalTitle
    title
    link {
      ...Link
      ...ExternalLink
      ...Modal
    }
    buttonStyle
    rightIcon
    sys {
      id
    }
    __typename
  }
`;


export const ImageFragment = gql`
  fragment Image on Image {
    internalTitle
    image {
      url
      width
      height
    }
    altText
    footnote
    sys {
      id
    }
    __typename
  }
`;

