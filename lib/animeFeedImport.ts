import Parser from "rss-parser";

import { ensureUniqueAnimeSlug } from "@/lib/animeAdmin";
import { getCurrentSeasonLabel } from "@/lib/animeSeason";
import { importVoiranimeCatalog } from "@/lib/voiranime";
import Anime from "@/models/Anime";

const parser = new Parser({
  timeout: 15_000,
  customFields: {
    item: ["media:thumbnail", "media:content", "content:encoded"],
  },
});

type ImportAnimeFeedOptions = {
  feedUrl: string;
  status: "airing" | "upcoming";
  currentSeasonLabel?: string;
  sourceName: string;
};

type ImportAnimeFeedResult = {
  imported: number;
  updated: number;
  totalItems: number;
};

export type ConfiguredAnimeFeed = {
  feedUrl: string;
  status: "airing" | "upcoming";
  sourceName: string;
  currentSeasonLabel?: string;
};

function stripHtml(value?: string) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveFeedImage(item: { "media:thumbnail"?: { $?: { url?: string } }; "media:content"?: { $?: { url?: string } } }) {
  const mediaThumb = item["media:thumbnail"];
  const mediaContent = item["media:content"];
  return mediaThumb?.$?.url || mediaContent?.$?.url;
}

export async function importAnimeFeed(options: ImportAnimeFeedOptions): Promise<ImportAnimeFeedResult> {
  if (options.feedUrl === "voiranime://airing" || options.feedUrl === "voiranime://upcoming") {
    const items = await importVoiranimeCatalog(options.feedUrl === "voiranime://airing" ? "airing" : "upcoming");
    let imported = 0;
    let updated = 0;

    for (const item of items) {
      const existing = await Anime.findOne({ title: item.title }).select({ _id: 1 }).lean();

      if (existing) {
        await Anime.updateOne(
          { _id: existing._id },
          {
            $set: {
              synopsis: item.synopsis,
              coverImage: item.coverImage,
              genres: item.genres,
              status: item.status,
              currentSeasonLabel: item.currentSeasonLabel,
              nextEpisodeAt: item.nextEpisodeAt,
              releaseDay: item.releaseDay,
              popularityScore: item.popularityScore,
              isPopularNow: item.popularityScore >= 40,
              notificationsEnabled: true,
            },
            ...(item.currentSeasonLabel ? { $addToSet: { seasons: item.currentSeasonLabel, tags: "voiranime" } } : { $addToSet: { tags: "voiranime" } }),
          },
        );
        updated += 1;
        continue;
      }

      const slug = await ensureUniqueAnimeSlug(item.title);
      await Anime.create({
        title: item.title,
        slug,
        synopsis: item.synopsis,
        coverImage: item.coverImage,
        genres: item.genres,
        tags: ["voiranime", item.status, ...item.genres.map((genre) => genre.toLowerCase())],
        seasons: item.currentSeasonLabel ? [item.currentSeasonLabel] : [],
        status: item.status,
        currentSeasonLabel: item.currentSeasonLabel,
        releaseDay: item.releaseDay,
        nextEpisodeAt: item.nextEpisodeAt,
        notificationsEnabled: true,
        popularityScore: item.popularityScore,
        isPopularNow: item.popularityScore >= 40,
      });
      imported += 1;
    }

    return { imported, updated, totalItems: items.length };
  }

  const response = await fetch(options.feedUrl, {
    headers: {
      "user-agent": "AnimeInfoBot/1.0 (+https://animeinfo.local)",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Feed request failed: ${response.status}`);
  }

  const xml = await response.text();
  const feed = await parser.parseString(xml);
  const items = feed.items || [];

  let imported = 0;
  let updated = 0;

  for (const item of items) {
    const title = item.title?.trim();
    if (!title) {
      continue;
    }

    const existing = await Anime.findOne({ title }).select({ _id: 1 }).lean();
    const synopsis = stripHtml(
      item.contentSnippet ||
        (typeof item["content:encoded"] === "string" ? item["content:encoded"] : item.content) ||
        "",
    );
    const coverImage = resolveFeedImage(item);
    const nextEpisodeAt = item.isoDate ? new Date(item.isoDate) : undefined;
    const currentSeasonLabel = options.currentSeasonLabel || (options.status === "airing" ? getCurrentSeasonLabel() : undefined);

    if (existing) {
      await Anime.updateOne(
        { _id: existing._id },
        {
          $set: {
            synopsis,
            coverImage,
            status: options.status,
            currentSeasonLabel,
            nextEpisodeAt,
            notificationsEnabled: true,
          },
          ...(currentSeasonLabel ? { $addToSet: { seasons: currentSeasonLabel } } : {}),
        },
      );
      updated += 1;
      continue;
    }

    const slug = await ensureUniqueAnimeSlug(title);
    await Anime.create({
      title,
      slug,
      synopsis,
      coverImage,
      genres: [],
      tags: [options.sourceName.toLowerCase(), options.status],
      seasons: currentSeasonLabel ? [currentSeasonLabel] : [],
      status: options.status,
      currentSeasonLabel,
      nextEpisodeAt,
      notificationsEnabled: true,
      popularityScore: 0,
      isPopularNow: false,
    });
    imported += 1;
  }

  return { imported, updated, totalItems: items.length };
}

function parseConfiguredAnimeFeeds(rawValue: string | undefined, config: Omit<ConfiguredAnimeFeed, "feedUrl">) {
  return (rawValue || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map<ConfiguredAnimeFeed>((feedUrl) => ({ feedUrl, ...config }));
}

export function getConfiguredAnimeFeeds() {
  const currentSeasonLabel = getCurrentSeasonLabel();
  const airingRaw = process.env.ANIME_AIRING_FEEDS || "voiranime://airing,https://myanimelist.net/rss.php?type=season";
  const upcomingRaw = process.env.ANIME_UPCOMING_FEEDS || "voiranime://upcoming,https://myanimelist.net/rss.php?type=upcoming";

  return [
    ...parseConfiguredAnimeFeeds(airingRaw, {
      status: "airing",
      sourceName: "anime-airing-feed",
      currentSeasonLabel,
    }),
    ...parseConfiguredAnimeFeeds(upcomingRaw, {
      status: "upcoming",
      sourceName: "anime-upcoming-feed",
    }),
  ];
}

export async function importConfiguredAnimeFeeds() {
  const feeds = getConfiguredAnimeFeeds();
  const results: Array<{ feedUrl: string; imported: number; updated: number; totalItems: number }> = [];
  const failures: Array<{ feedUrl: string; error: string }> = [];

  for (const feed of feeds) {
    try {
      results.push({
        feedUrl: feed.feedUrl,
        ...(await importAnimeFeed(feed)),
      });
    } catch (error) {
      failures.push({
        feedUrl: feed.feedUrl,
        error: error instanceof Error ? error.message : "Unknown import error",
      });
    }
  }

  return {
    feeds,
    results,
    failures,
    imported: results.reduce((sum, item) => sum + item.imported, 0),
    updated: results.reduce((sum, item) => sum + item.updated, 0),
    totalItems: results.reduce((sum, item) => sum + item.totalItems, 0),
  };
}