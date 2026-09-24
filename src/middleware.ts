import { NextResponse, type NextRequest } from "next/server";

import { locales, defaultLocale } from "@aces/i18n";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // `sitemap.xml` and `robots.txt` must stay at the root: the Salesforce
  // sitemap connector fetches them by their canonical path, and a locale
  // rewrite turns them into a 404.
  if (
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/fonts") ||
    pathname.startsWith("/scripts") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt"
  ) {
    return;
  }

  const acceptLanguage = request.headers.get("accept-language") || "";
  const browserLocale = acceptLanguage.split(",")[0].split("-")[0];

  const supportedLocales = locales.map((localeObj) => localeObj.locale);

  const detectedLocale = supportedLocales.includes(browserLocale)
    ? browserLocale
    : defaultLocale;

  if (
    pathname.startsWith(`/${defaultLocale}/`) ||
    pathname === `/${defaultLocale}`
  ) {
    return NextResponse.redirect(
      new URL(
        pathname.replace(
          `/${defaultLocale}`,
          pathname === `/${defaultLocale}` ? "/" : "",
        ),
        request.url,
      ),
    );
  }

  const pathnameIsMissingLocale = locales.every(
    (localeObj) =>
      !pathname.startsWith(`/${localeObj.locale}/`) &&
      pathname !== `/${localeObj.locale}`,
  );

  if (pathnameIsMissingLocale) {
    return NextResponse.rewrite(
      new URL(
        `/${detectedLocale}${pathname}${request.nextUrl.search}`,
        request.nextUrl.href,
      ),
    );
  }
}

export const config = {
  matcher: [
    "/((?!_next|static|images|favicon.ico|assets|fonts|api|scripts|sitemap.xml|robots.txt).*)",
  ],
};
