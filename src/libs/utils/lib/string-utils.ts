export const generateId = (title?: string | null) =>
  (title ?? "").replace(/\s+/g, "");

/**
 * Anchor-safe slug for in-page links, used by both the rich-text heading
 * renderer and the table of contents — they must agree or the TOC links
 * point nowhere.
 */
export const slugify = (value?: string | null) =>
  (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const sliceSlug = (route: string[]) => route.slice(-1)[0];

export const removeWhitespace = (str: string) => {
  return str.replace(/\s+/g, "");
};

export const flattenObjectArray = (items: [], key: string) => {
  return items.map((item) => item[key]).filter((value) => value !== undefined);
};

export const toSingleValueArray = (
  value: string | any[] | null | undefined,
): any[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  return [value];
};

export const slugToString = (slug: string) => {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char);
};

export const truncate = (str: string, wordCount: number) => {
  const words = str.split(" ");
  return words.length > wordCount
    ? words.slice(0, wordCount).join(" ") + "..."
    : str;
};
