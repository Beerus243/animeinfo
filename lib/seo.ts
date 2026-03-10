import type { Metadata } from "next";

type SeoInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
};

type ArticleSeoInput = SeoInput & {
  publishedTime?: Date | string;
  modifiedTime?: Date | string;
  authors?: string[];
  tags?: string[];
};

function getSiteUrl() {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildMetadata(input: SeoInput): Metadata {
  const canonical = absoluteUrl(input.path);

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
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