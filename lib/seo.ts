import type { Metadata } from "next";

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
};

type CollectionSeoInput = SeoInput & {
  itemPaths?: string[];
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

function getSiteUrl() {
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
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      type: input.type || "website",
      images: input.image ? [{ url: absoluteUrl(input.image) }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: input.image ? [absoluteUrl(input.image)] : undefined,
    },
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
    author: (input.authors || ["AnimeInfo Editorial"]).map((name) => ({
      "@type": "Person",
      name,
    })),
    keywords: input.tags?.join(", "),
    publisher: {
      "@type": "Organization",
      name: "AnimeInfo",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/og/placeholder-1200x630.svg"),
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
    hasPart: input.itemPaths?.slice(0, 20).map((path, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(path),
    })),
  };
}