import { getCurrentSeasonLabel } from "@/lib/animeSeason";
import type { ConfiguredRssSource } from "@/lib/rssParser";

const DEFAULT_BASE_URL = "https://v6.voiranime.com";
const DEFAULT_GENRE_SLUGS = [
  "action",
  "adventure",
  "chinese",
  "comedy",
  "drama",
  "ecchi",
  "fantasy",
  "horror",
  "mahou-shoujo",
  "mecha",
  "music",
  "mystery",
  "psychological",
  "romance",
  "sci-fi",
  "slice-of-life",
  "sports",
  "supernatural",
  "thriller",
];

export type VoiranimeCatalogItem = {
  title: string;
  url: string;
  coverImage?: string;
  popularityScore: number;
  nextEpisodeAt?: Date;
  genres: string[];
  synopsis?: string;
  releaseDay?: string;
  currentSeasonLabel?: string;
  status: "airing" | "upcoming";
};

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "-")
    .replace(/&nbsp;/g, " ");
}

function stripHtml(value?: string) {
  return decodeHtmlEntities(String(value || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function getVoiranimeBaseUrl() {
  return (process.env.VOIRANIME_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

async function fetchVoiranimeHtml(pathOrUrl: string) {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${getVoiranimeBaseUrl()}${pathOrUrl}`;
  const response = await fetch(url, {
    headers: {
      "user-agent": "AnimeInfoBot/1.0 (+https://animeinfo.local)",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Voiranime request failed: ${response.status}`);
  }

  return response.text();
}

function parsePublishedDate(value?: string) {
  const text = stripHtml(value).toLowerCase();
  if (!text) {
    return undefined;
  }

  const relativeMatch = text.match(/(\d+)\s+(second|seconds|minute|minutes|hour|hours|day|days)\s+ago/);
  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2];
    const date = new Date();

    if (unit.startsWith("second")) {
      date.setUTCSeconds(date.getUTCSeconds() - amount);
    } else if (unit.startsWith("minute")) {
      date.setUTCMinutes(date.getUTCMinutes() - amount);
    } else if (unit.startsWith("hour")) {
      date.setUTCHours(date.getUTCHours() - amount);
    } else if (unit.startsWith("day")) {
      date.setUTCDate(date.getUTCDate() - amount);
    }

    return date;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseDetailField(html: string, label: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<div class="post-content_item">[\\s\\S]*?<h5>\\s*${escapedLabel}\\s*<\\/h5>[\\s\\S]*?<div class="summary-content">([\\s\\S]*?)<\\/div>`,
    "i",
  );
  const match = html.match(pattern);
  return stripHtml(match?.[1]);
}

function parseGenres(html: string) {
  const sectionMatch = html.match(/<div class="genres-content">([\s\S]*?)<\/div>/i);
  const section = sectionMatch?.[1] || "";

  return Array.from(section.matchAll(/anime-genre\/[^"']+\/"[^>]*>([^<]+)<\/a>/gi))
    .map((match) => stripHtml(match[1]))
    .filter(Boolean);
}

function parseSynopsis(html: string) {
  const match = html.match(/<div class="summary__content\s*">([\s\S]*?)<\/div>/i);
  return stripHtml(match?.[1]);
}

function parsePopularityScore(value?: string) {
  const parsed = Number.parseFloat(stripHtml(value));
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.round(parsed * 10);
}

function parseCatalogCards(html: string) {
  const cards = Array.from(
    html.matchAll(
      /<div class="page-item-detail video">[\s\S]*?<a href="(https:\/\/v6\.voiranime\.com\/anime\/[^"#]+\/?)" title="([^"]+)">[\s\S]*?<img[^>]+src="([^">]+)"[\s\S]*?<span class="score[^>]*>([\d.]+)<\/span>[\s\S]*?<span class="post-on font-meta">\s*([^<]+)\s*<\/span>/gi,
    ),
  );

  const seen = new Set<string>();

  return cards
    .map((card) => {
      const url = card[1]?.trim();
      if (!url || seen.has(url)) {
        return null;
      }

      seen.add(url);

      return {
        title: decodeHtmlEntities(card[2]?.trim() || ""),
        url,
        coverImage: card[3]?.trim(),
        popularityScore: parsePopularityScore(card[4]),
        nextEpisodeAt: parsePublishedDate(card[5]),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

async function enrichVoiranimeCatalogItem(
  item: ReturnType<typeof parseCatalogCards>[number],
  status: "airing" | "upcoming",
): Promise<VoiranimeCatalogItem> {
  const html = await fetchVoiranimeHtml(item.url);
  const startDate = parsePublishedDate(parseDetailField(html, "Start date"));
  const explicitStatus = parseDetailField(html, "Status");
  const normalizedStatus = explicitStatus.toLowerCase().includes("en cours") ? "airing" : status;
  const genres = parseGenres(html);
  const synopsis = parseSynopsis(html);
  const currentSeasonLabel = startDate ? getCurrentSeasonLabel(startDate) : normalizedStatus === "airing" ? getCurrentSeasonLabel() : undefined;

  return {
    title: item.title,
    url: item.url,
    coverImage: item.coverImage,
    popularityScore: item.popularityScore,
    nextEpisodeAt: item.nextEpisodeAt,
    genres,
    synopsis,
    releaseDay: item.nextEpisodeAt?.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }),
    currentSeasonLabel,
    status: normalizedStatus,
  };
}

export async function importVoiranimeCatalog(status: "airing" | "upcoming") {
  const path = status === "airing" ? "/" : "/prochainement/";
  const html = await fetchVoiranimeHtml(path);
  const cards = parseCatalogCards(html).slice(0, 24);

  const items: VoiranimeCatalogItem[] = [];
  for (const card of cards) {
    try {
      items.push(await enrichVoiranimeCatalogItem(card, status));
    } catch {
      items.push({
        title: card.title,
        url: card.url,
        coverImage: card.coverImage,
        popularityScore: card.popularityScore,
        nextEpisodeAt: card.nextEpisodeAt,
        genres: [],
        releaseDay: card.nextEpisodeAt?.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }),
        currentSeasonLabel: status === "airing" ? getCurrentSeasonLabel() : undefined,
        status,
      });
    }
  }

  return items;
}

export async function getVoiranimeGenreSources(): Promise<ConfiguredRssSource[]> {
  const rawConfiguredSlugs = (process.env.VOIRANIME_GENRE_SLUGS || "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);

  let slugs = rawConfiguredSlugs;

  if (!slugs.length) {
    try {
      const html = await fetchVoiranimeHtml("/");
      slugs = Array.from(new Set(Array.from(html.matchAll(/anime-genre\/([a-z0-9-]+)\//gi)).map((match) => match[1]))).slice(0, 12);
    } catch {
      slugs = DEFAULT_GENRE_SLUGS.slice(0, 12);
    }
  }

  const baseUrl = getVoiranimeBaseUrl();
  return slugs.map((slug) => ({
    feedUrl: `${baseUrl}/anime-genre/${slug}/feed/`,
    kind: "news",
    sourceCategory: slug,
    defaultTags: [slug, "voiranime"],
  }));
}