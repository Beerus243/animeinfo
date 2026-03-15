import type { Metadata } from "next";

import { getSocialSameAs } from "@/lib/socialLinks";

export const SITE_NAME = "Manga Empire";
export const DEFAULT_OG_IMAGE = "/opengraph-image";

type SeoInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  languages?: Record<string, string>;
};

type ArticleSeoInput = SeoInput & {
  publishedTime?: Date | string;
  modifiedTime?: Date | string;
  authors?: string[];
  tags?: string[];
  section?: string;
  locale?: string;
};

type CollectionSeoInput = SeoInput & {
  itemPaths?: string[];
};

type BreadcrumbItemInput = {
  name: string;
  path: string;
};

function getSiteUrlSource() {
  const explicitSiteUrl = process.env.SITE_URL?.trim();
  if (explicitSiteUrl && !/^https?:\/\/localhost(?::\d+)?$/i.test(explicitSiteUrl)) {
    return { url: explicitSiteUrl.replace(/\/$/, ""), source: "SITE_URL" as const };
  }

  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProductionUrl) {
    return { url: `https://${vercelProductionUrl.replace(/^https?:\/\//i, "").replace(/\/$/, "")}`, source: "VERCEL_PROJECT_PRODUCTION_URL" as const };
  }

  const vercelPreviewUrl = process.env.VERCEL_URL?.trim();
  if (vercelPreviewUrl) {
    return { url: `https://${vercelPreviewUrl.replace(/^https?:\/\//i, "").replace(/\/$/, "")}`, source: "VERCEL_URL" as const };
  }

  return { url: (explicitSiteUrl || "http://localhost:3000").replace(/\/$/, ""), source: explicitSiteUrl ? "SITE_URL_LOCALHOST" as const : "DEFAULT_LOCALHOST" as const };
}

export function getSiteUrl() {
  return getSiteUrlSource().url;
}

export function getSiteUrlDiagnostics() {
  const resolved = getSiteUrlSource();
  return {
    resolvedUrl: resolved.url,
    source: resolved.source,
    usesLocalhost: /^https?:\/\/localhost(?::\d+)?$/i.test(resolved.url),
  };
}

export function absoluteUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildMetadata(input: SeoInput): Metadata {
  const canonical = absoluteUrl(input.path);
  const languages = input.languages
    ? Object.fromEntries(Object.entries(input.languages).map(([locale, path]) => [locale, absoluteUrl(path)]))
    : undefined;

  return {
    title: input.title,
    description: input.description,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: {
      canonical,
      languages,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: SITE_NAME,
      type: input.type || "website",
      images: [{ url: absoluteUrl(input.image || DEFAULT_OG_IMAGE), width: 1200, height: 630, alt: input.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [{ url: absoluteUrl(input.image || DEFAULT_OG_IMAGE), width: 1200, height: 630, alt: input.title }],
    },
  };
}

export function buildBrandJsonLd(description: string) {
  const websiteUrl = absoluteUrl("/");
  const sameAs = getSocialSameAs();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${websiteUrl}#organization`,
        name: SITE_NAME,
        alternateName: "Manga Empire Media",
        url: websiteUrl,
        description,
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/icon"),
        },
        image: absoluteUrl(DEFAULT_OG_IMAGE),
        sameAs: sameAs.length ? sameAs : undefined,
      },
      {
        "@type": "WebSite",
        "@id": `${websiteUrl}#website`,
        name: SITE_NAME,
        alternateName: "Manga Empire Media",
        url: websiteUrl,
        description,
        inLanguage: ["fr", "en"],
        publisher: {
          "@id": `${websiteUrl}#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: absoluteUrl("/search?q={search_term_string}"),
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export function buildArticleJsonLd(input: ArticleSeoInput) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: input.title,
    description: input.description,
    mainEntityOfPage: absoluteUrl(input.path),
    image: input.image ? [absoluteUrl(input.image)] : undefined,
    datePublished: input.publishedTime ? new Date(input.publishedTime).toISOString() : undefined,
    dateModified: input.modifiedTime ? new Date(input.modifiedTime).toISOString() : undefined,
    inLanguage: input.locale,
    isAccessibleForFree: true,
    articleSection: input.section,
    author: (input.authors || ["Manga Empire Editorial"]).map((name) => ({
      "@type": "Person",
      name,
    })),
    keywords: input.tags?.join(", "),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon"),
      },
    },
  };
}

export function buildCollectionJsonLd(input: CollectionSeoInput) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    isPartOf: {
      "@id": `${absoluteUrl("/")}#website`,
    },
    mainEntity: input.itemPaths?.length
      ? {
          "@type": "ItemList",
          itemListElement: input.itemPaths.slice(0, 20).map((path, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: absoluteUrl(path),
          })),
        }
      : undefined,
    hasPart: input.itemPaths?.slice(0, 20).map((path, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(path),
    })),
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItemInput[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}