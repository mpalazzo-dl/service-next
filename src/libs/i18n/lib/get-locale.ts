import { defaultLocale, locales } from "./locales";

type Locale = string;
export type TranslationSection = string;

const normalizeLocale = (locale: string): string => {
  return locale.replace("-", "");
};

const generateTranslations = () => {
  const translations: Record<
    Locale,
    Record<TranslationSection, () => Promise<any>>
  > = {};

  locales.forEach(({ locale, trans }) => {
    const normalizedLocale = normalizeLocale(locale);
    translations[normalizedLocale] = {
      common: () =>
        import(`../locale/${trans}/common.json`).then(
          (module) => module.default,
        ),
      seo: () =>
        import(`../locale/${trans}/seo.json`).then((module) => module.default),
      components: () =>
        import(`../locale/${trans}/components.json`).then(
          (module) => module.default,
        ),
      errors: () =>
        import(`../locale/${trans}/errors.json`).then(
          (module) => module.default,
        ),
    };
  });

  return translations;
};

const translations = generateTranslations();

/**
 * Never throws on an unknown locale or section.
 *
 * Previously an unrecognised locale indexed into `undefined` and threw, which
 * left `useGetLocale` with `t === null` while `loading` had already flipped to
 * false — and every caller dereferences `t` directly, so the component crashed
 * the whole page rather than rendering without a label.
 */
export const getLocale = async (
  locale: Locale,
  section: TranslationSection,
): Promise<any> => {
  const normalized = normalizeLocale(locale ?? "");
  const bundle =
    translations[normalized] ?? translations[normalizeLocale(defaultLocale)];

  const load = bundle?.[section];
  if (!load) {
    console.warn(`No translations for locale "${locale}" section "${section}"`);
    return {};
  }

  try {
    return await load();
  } catch (error) {
    console.error(`Failed to load translations for "${section}":`, error);
    return {};
  }
};
