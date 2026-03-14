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
  const storageKey = "mangaempire-theme";
  const legacyStorageKey = "animeinfo-theme";
  const root = document.documentElement;
  const savedTheme = window.localStorage.getItem(storageKey) || window.localStorage.getItem(legacyStorageKey);
  if (!window.localStorage.getItem(storageKey) && savedTheme) {
    window.localStorage.setItem(storageKey, savedTheme);
    window.localStorage.removeItem(legacyStorageKey);
  }
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
  applicationName: "Manga Empire",
  title: {
    default: "Manga Empire",
    template: "%s | Manga Empire",
  },
  description: "Manga Empire suit les sorties, les tendances et les recommandations manga et anime dans une experience editoriale claire et rapide.",
  keywords: ["Manga Empire", "manga empire", "actualites manga", "actualites anime", "anime en cours", "recommandations manga", "recommandations anime"],
  category: "entertainment",
  openGraph: {
    siteName: "Manga Empire",
    title: "Manga Empire",
    description: "Manga Empire suit les sorties, les tendances et les recommandations manga et anime dans une experience editoriale claire et rapide.",
    url: getSiteUrl(),
    type: "website",
    images: [{ url: "/og/placeholder-1200x630.svg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Manga Empire",
    description: "Manga Empire suit les sorties, les tendances et les recommandations manga et anime dans une experience editoriale claire et rapide.",
    images: ["/og/placeholder-1200x630.svg"],
  },
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const locale = await getServerLocale();
  const brandJsonLd = buildBrandJsonLd("Manga Empire suit les sorties, les tendances et les recommandations manga et anime dans une experience editoriale claire et rapide.");

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
