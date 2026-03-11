import { NextRequest } from "next/server";

import { getCurrentSeasonLabel } from "@/lib/animeSeason";
import { connectToDatabase } from "@/lib/mongodb";
import { getLatestPersistedTrendSnapshot, getRssTrendSnapshot } from "@/lib/rssTrends";
import { buildRssFeed } from "@/lib/rssXml";
import { absoluteUrl } from "@/lib/seo";
import { slugify } from "@/lib/slugify";
import Anime from "@/models/Anime";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

type CategoryRow = {
  _id: string;
  count: number;
  latestPublishedAt?: Date;
};

type AnimeGenreRow = {
  _id: string;
  count: number;
  latestUpdatedAt?: Date;
};

function xmlResponse(xml: string) {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}

function notFoundFeed() {
  return new Response("Feed not found.", { status: 404 });
}

async function buildAiringFeed() {
  const currentSeasonLabel = getCurrentSeasonLabel();
  const animes = await Anime.find({
    notificationsEnabled: { $ne: false },
    $or: [{ status: "airing" }, { currentSeasonLabel }, { seasons: currentSeasonLabel }],
  })
    .sort({ isPopularNow: -1, popularityScore: -1, nextEpisodeAt: 1, updatedAt: -1 })
    .limit(30)
    .lean();

  return buildRssFeed({
    title: "AnimeInfo RSS - Animes en cours",
    description: "Flux RSS interne des animes en cours importes et enrichis dans AnimeInfo.",
    path: "/rss/airing",
    items: animes.map((anime) => ({
      title: anime.title,
      link: `/anime/${anime.slug}`,
      description: anime.synopsis || `Saison ${anime.currentSeasonLabel || currentSeasonLabel}. Score ${anime.popularityScore || 0}.`,
      guid: `anime:${anime.slug}`,
      pubDate: anime.nextEpisodeAt || anime.updatedAt,
      categories: [anime.status || "airing", ...(anime.genres || []).slice(0, 4)],
    })),
  });
}

async function buildTrendingFeed() {
  const snapshot = (await getLatestPersistedTrendSnapshot()) || (await getRssTrendSnapshot());

  return buildRssFeed({
    title: "AnimeInfo RSS - Tendances anime",
    description: "Flux RSS interne des tendances issues des snapshots RSS et sources anime suivies par AnimeInfo.",
    path: "/rss/trending",
    items: snapshot.liveItems.map((item) => ({
      title: item.title,
      link: item.url,
      description: `Source ${item.sourceLabel}. Republie depuis le snapshot de tendances AnimeInfo.`,
      guid: `trend:${item.sourceLabel}:${item.url}`,
      pubDate: item.publishedAt,
      categories: [item.sourceLabel],
    })),
  });
}

async function buildSeasonFeed() {
  const currentSeasonLabel = getCurrentSeasonLabel();
  const animes = await Anime.find({
    $or: [{ currentSeasonLabel }, { seasons: currentSeasonLabel }],
  })
    .sort({ isPopularNow: -1, popularityScore: -1, nextEpisodeAt: 1, updatedAt: -1 })
    .limit(30)
    .lean();

  return buildRssFeed({
    title: `AnimeInfo RSS - ${currentSeasonLabel}`,
    description: `Flux RSS interne des animes relies a la saison ${currentSeasonLabel}.`,
    path: "/rss/season",
    items: animes.map((anime) => ({
      title: anime.title,
      link: `/anime/${anime.slug}`,
      description: anime.synopsis || `Anime de la saison ${anime.currentSeasonLabel || currentSeasonLabel}.`,
      guid: `season:${currentSeasonLabel}:${anime.slug}`,
      pubDate: anime.nextEpisodeAt || anime.updatedAt,
      categories: [anime.currentSeasonLabel || currentSeasonLabel, ...(anime.genres || []).slice(0, 3)],
    })),
  });
}

async function buildCategoriesFeed() {
  const [articleCategories, animeGenreCategories] = await Promise.all([
    Article.aggregate<CategoryRow>([
      { $match: { status: "published", category: { $type: "string", $ne: "" } } },
      { $group: { _id: "$category", count: { $sum: 1 }, latestPublishedAt: { $max: "$publishedAt" } } },
      { $sort: { count: -1, latestPublishedAt: -1, _id: 1 } },
      { $limit: 24 },
    ]),
    Anime.aggregate<AnimeGenreRow>([
      { $match: { genres: { $exists: true, $ne: [] } } },
      { $unwind: "$genres" },
      { $match: { genres: { $type: "string", $ne: "" } } },
      { $group: { _id: "$genres", count: { $sum: 1 }, latestUpdatedAt: { $max: "$updatedAt" } } },
      { $sort: { count: -1, latestUpdatedAt: -1, _id: 1 } },
      { $limit: 24 },
    ]),
  ]);

  const categoryMap = new Map<string, CategoryRow>();
  for (const category of articleCategories) {
    categoryMap.set(category._id, category);
  }

  for (const category of animeGenreCategories) {
    const existing = categoryMap.get(category._id);
    categoryMap.set(category._id, {
      _id: category._id,
      count: (existing?.count || 0) + category.count,
      latestPublishedAt: existing?.latestPublishedAt || category.latestUpdatedAt,
    });
  }

  const categories = Array.from(categoryMap.values())
    .sort((a, b) => b.count - a.count || (b.latestPublishedAt?.getTime() || 0) - (a.latestPublishedAt?.getTime() || 0) || a._id.localeCompare(b._id))
    .slice(0, 24);

  return buildRssFeed({
    title: "AnimeInfo RSS - Categories anime",
    description: "Flux RSS interne des categories et genres dominants agreges dans AnimeInfo.",
    path: "/rss/categories",
    items: categories.map((category) => ({
      title: `${category._id} (${category.count})`,
      link: absoluteUrl(`/search?q=${encodeURIComponent(category._id)}`),
      description: `Categorie ou genre visible dans AnimeInfo avec ${category.count} element(s).`,
      guid: `category:${slugify(category._id)}`,
      pubDate: category.latestPublishedAt,
      categories: [category._id],
    })),
  });
}

export async function GET(_request: NextRequest, context: { params: Promise<{ feed: string }> }) {
  const { feed } = await context.params;

  await connectToDatabase();

  if (feed === "airing") {
    return xmlResponse(await buildAiringFeed());
  }

  if (feed === "trending") {
    return xmlResponse(await buildTrendingFeed());
  }

  if (feed === "season") {
    return xmlResponse(await buildSeasonFeed());
  }

  if (feed === "categories") {
    return xmlResponse(await buildCategoriesFeed());
  }

  return notFoundFeed();
}