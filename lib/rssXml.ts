import { absoluteUrl } from "@/lib/seo";

type RssFeedItem = {
  title: string;
  link: string;
  description?: string;
  guid?: string;
  pubDate?: Date | string;
  categories?: string[];
};

type BuildRssFeedInput = {
  title: string;
  description: string;
  path: string;
  items: RssFeedItem[];
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822Date(value?: Date | string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toUTCString();
}

export function buildRssFeed(input: BuildRssFeedInput) {
  const feedUrl = absoluteUrl(input.path);
  const itemsXml = input.items
    .map((item) => {
      const link = absoluteUrl(item.link);
      const guid = escapeXml(item.guid || link);
      const categoriesXml = (item.categories || [])
        .filter(Boolean)
        .map((category) => `<category>${escapeXml(category)}</category>`)
        .join("");
      const pubDate = toRfc822Date(item.pubDate);

      return [
        "<item>",
        `<title>${escapeXml(item.title)}</title>`,
        `<link>${escapeXml(link)}</link>`,
        `<guid isPermaLink=\"false\">${guid}</guid>`,
        item.description ? `<description>${escapeXml(item.description)}</description>` : undefined,
        pubDate ? `<pubDate>${escapeXml(pubDate)}</pubDate>` : undefined,
        categoriesXml || undefined,
        "</item>",
      ]
        .filter(Boolean)
        .join("");
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(input.title)}</title>
    <link>${escapeXml(feedUrl)}</link>
    <description>${escapeXml(input.description)}</description>
    <language>fr-FR</language>
    <generator>AnimeInfo</generator>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`;
}