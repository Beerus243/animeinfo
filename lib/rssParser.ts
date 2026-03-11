import Parser from "rss-parser";

import { slugify } from "@/lib/slugify";

const parser = new Parser({
  timeout: 15_000,
  customFields: {
    item: ["media:thumbnail", "media:content", "content:encoded"],
  },
});

export type NormalizedRssItem = {
  title: string;
  slug: string;
  excerpt: string;
  originalUrl: string;
  coverImage?: string;
  publishedAt?: Date;
  sourceName: string;
  content?: string;
  categories: string[];
};

export type ConfiguredRssSource = {
  feedUrl: string;
  kind: "news" | "recommendation";
  recommendationType?: "anime" | "manga";
  sourceCategory?: string;
  defaultTags?: string[];
};

function getMetaContent(html: string, attributeName: string, attributeValue: string) {
  const escapedValue = attributeValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+${attributeName}=["']${escapedValue}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attributeName}=["']${escapedValue}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

async function fetchHtml(url: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);

  const response = await fetch(url, {
    headers: {
      "user-agent": "AnimeInfoBot/1.0 (+https://animeinfo.local)",
    },
    next: { revalidate: 0 },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  if (!response.ok) {
    throw new Error(`Unable to fetch source page: ${response.status}`);
  }

  return response.text();
}

export async function resolveArticleImage(originalUrl?: string, currentImage?: string) {
  if (currentImage) {
    return currentImage;
  }

  if (!originalUrl) {
    return undefined;
  }

  try {
    const html = await fetchHtml(originalUrl);
    return (
      getMetaContent(html, "property", "og:image") ||
      getMetaContent(html, "name", "twitter:image") ||
      getMetaContent(html, "property", "og:image:secure_url")
    );
  } catch {
    return undefined;
  }
}

function getExcerpt(value?: string) {
  if (!value) {
    return "";
  }

  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 240);
}

export async function fetchRssFeed(feedUrl: string) {
  const feed = await parser.parseURL(feedUrl);

  return Promise.all((feed.items ?? []).map<Promise<NormalizedRssItem>>(async (item) => {
    const title = item.title?.trim() || "Untitled anime news";
    const originalUrl = item.link?.trim() || "";
    const rawContent =
      (typeof item["content:encoded"] === "string" && item["content:encoded"]) ||
      item.content ||
      item.contentSnippet ||
      "";
    const categories = Array.isArray((item as { categories?: unknown }).categories)
      ? (item as { categories?: unknown[] }).categories
          ?.map((value) => String(value || "").trim())
          .filter(Boolean) || []
      : [];
    const mediaThumb = item["media:thumbnail"] as { $?: { url?: string } } | undefined;
    const mediaContent = item["media:content"] as { $?: { url?: string } } | undefined;
    const coverImage = await resolveArticleImage(originalUrl, mediaThumb?.$?.url || mediaContent?.$?.url);

    return {
      title,
      slug: slugify(title),
      excerpt: getExcerpt(item.contentSnippet || rawContent),
      originalUrl,
      coverImage,
      publishedAt: item.isoDate ? new Date(item.isoDate) : undefined,
      sourceName: feed.title || new URL(feedUrl).hostname,
      content: typeof rawContent === "string" ? rawContent : undefined,
      categories,
    };
  }));
}

function parseConfiguredSources(
  rawValue: string | undefined,
  config: Omit<ConfiguredRssSource, "feedUrl">,
) {
  return (rawValue || "")
    .split(",")
    .map((source) => source.trim())
    .filter(Boolean)
    .map<ConfiguredRssSource>((feedUrl) => ({ feedUrl, ...config }));
}

export function getConfiguredRssSourceGroups() {
  return [
    ...parseConfiguredSources(process.env.RSS_SOURCES, {
      kind: "news",
      sourceCategory: "news",
      defaultTags: ["news"],
    }),
    ...parseConfiguredSources(process.env.RSS_RECOMMENDATION_ANIME_SOURCES, {
      kind: "recommendation",
      recommendationType: "anime",
      sourceCategory: "anime-recommendations",
      defaultTags: ["recommendation", "anime"],
    }),
    ...parseConfiguredSources(process.env.RSS_RECOMMENDATION_MANGA_SOURCES, {
      kind: "recommendation",
      recommendationType: "manga",
      sourceCategory: "manga-recommendations",
      defaultTags: ["recommendation", "manga"],
    }),
  ];
}

export function getConfiguredRssSources() {
  return getConfiguredRssSourceGroups().map((source) => source.feedUrl);
}