import React from "react";
import Script from "next/script";
import { draftMode } from "next/headers";
import { GoogleTagManager } from "@next/third-parties/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { ThemeProvider } from "@mui/material/styles";

import { defaultLocale } from "@aces/i18n";
import { palette, primaryFont, theme } from "@aces/theme";
import { FlexBox } from "@aces/ui";
import {
  DraftModeBar,
  EnableSallyAssistant,
  FooterServer,
  HeaderServer,
  LivePreviewProvider,
  Sally,
} from "@aces/features";

import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/effect-creative";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";

import "./styles.css";

export async function generateMetadata() {
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  // Next 15 passes route params as a promise.
  params: Promise<{ lang?: string }>;
}>) {
  const { lang = defaultLocale } = (await params) ?? {};
  const { isEnabled } = await draftMode();
  const appId = process.env.NEXT_PUBLIC_CF_APP_ID || "";
  const gtmId = process.env.NEXT_PUBLIC_CF_GTM_ID || "";

  return (
    <html lang={lang} className={primaryFont.variable}>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      <body style={{ backgroundColor: palette.background.default }}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <HeaderServer
              appId={appId}
              sticky={true}
              preview={isEnabled}
              lang={lang}
            />
            <FlexBox component="main" flexDirection={"column"} flex={1}>
              {isEnabled ? (
                <LivePreviewProvider locale={lang}>
                  {children}
                </LivePreviewProvider>
              ) : (
                children
              )}
            </FlexBox>
            <FooterServer appId={appId} preview={isEnabled} lang={lang} />
            {EnableSallyAssistant && <Sally />}
            {isEnabled && <DraftModeBar />}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
