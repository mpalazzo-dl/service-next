export type OrderByTypes = "ASC" | "DESC";

export enum OrderTypes {
  AlphaASC = "title_ASC",
  AlphaDESC = "title_DESC",
  DateASC = "publishDate_ASC",
  DateDESC = "publishDate_DESC",
}

/** URL parameters that drive the Knowledge Base listing. */
export enum Query {
  concepts = "concepts",
  recordType = "type",
  order = "order",
}

export const ArticleListingConfig = {
  ArticlesLimit: 15,
  DefaultOrder: OrderTypes.AlphaASC,
};
