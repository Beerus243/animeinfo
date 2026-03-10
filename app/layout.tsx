import type { Metadata } from "next";
import Script from "next/script";
import { Bricolage_Grotesque, Space_Grotesk } from "next/font/google";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import ConsentBanner from "@/app/components/ConsentBanner";
import LanguageProvider from "@/app/components/LanguageProvider";
import { getServerLocale } from "@/lib/i18n/server";
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
  title: {
    default: "AnimeInfo",
    template: "%s | AnimeInfo",
  },
  description: "Actualites anime, curation editoriale, SEO structure et publication prete a monetiser avec Next.js.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const locale = await getServerLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrap}
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
