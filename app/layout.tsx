import type { Metadata } from "next";
import Script from "next/script";
import { Bricolage_Grotesque, Space_Grotesk } from "next/font/google";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import ConsentBanner from "@/app/components/ConsentBanner";
import LanguageProvider from "@/app/components/LanguageProvider";
import { getServerLocale } from "@/lib/i18n/server";
import { buildBrandJsonLd, getSiteUrl } from "@/lib/seo";
import "./globals.css";

const themeBootstrap = `(() => {
  const storageKey = "animeinfo-theme";
  const root = document.documentElement;
  const savedTheme = window.localStorage.getItem(storageKey);
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = savedTheme || (systemDark ? "dark" : "light");
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
})();`;

const displayFont = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: "AnimeInfo",
  title: {
    default: "AnimeInfo",
    template: "%s | AnimeInfo",
  },
  description: "AnimeInfo suit les sorties, les tendances et les recommandations anime dans une experience editoriale claire et rapide.",
  keywords: ["AnimeInfo", "Anime info", "actualites anime", "anime en cours", "recommandations anime", "trending anime"],
  category: "entertainment",
  openGraph: {
    siteName: "AnimeInfo",
    title: "AnimeInfo",
    description: "AnimeInfo suit les sorties, les tendances et les recommandations anime dans une experience editoriale claire et rapide.",
    url: getSiteUrl(),
    type: "website",
    images: [{ url: "/og/placeholder-1200x630.svg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AnimeInfo",
    description: "AnimeInfo suit les sorties, les tendances et les recommandations anime dans une experience editoriale claire et rapide.",
    images: ["/og/placeholder-1200x630.svg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const locale = await getServerLocale();
  const brandJsonLd = buildBrandJsonLd("AnimeInfo suit les sorties, les tendances et les recommandations anime dans une experience editoriale claire et rapide.");

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrap}
        </Script>
        <Script id="brand-jsonld" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(brandJsonLd)}
        </Script>
      </head>
      <body
        className={`${displayFont.variable} ${bodyFont.variable} app-shell antialiased`}
      >
        <LanguageProvider initialLocale={locale}>
          {adsenseClient ? (
            <Script
              id="adsense-script"
              async
              crossOrigin="anonymous"
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
              strategy="afterInteractive"
            />
          ) : null}
          <Header />
          <main>{children}</main>
          <Footer />
          <ConsentBanner />
        </LanguageProvider>
      </body>
    </html>
  );
}
