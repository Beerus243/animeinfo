import type { MetadataRoute } from "next";

import { connectToDatabase } from "@/lib/mongodb";
import { absoluteUrl } from "@/lib/seo";
import Anime from "@/models/Anime";
import Article from "@/models/Article";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "hourly", priority: 1 },
    { url: absoluteUrl("/news"), changeFrequency: "hourly", priority: 0.9 },
    { url: absoluteUrl("/trending"), changeFrequency: "hourly", priority: 0.85 },
    { url: absoluteUrl("/season"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/categories"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/search"), changeFrequency: "weekly", priority: 0.4 },
  ];

  if (!process.env.MONGODB_URI) {
    return staticRoutes;
  }

  await connectToDatabase();

  const [articles, categoryRows, tagRows, animes] = await Promise.all([
    Article.find({ status: "published" })
      .select({ slug: 1, updatedAt: 1, publishedAt: 1 })
      .sort({ publishedAt: -1, updatedAt: -1 })
      .lean(),
    Article.aggregate<{ _id: string }>([
      { $match: { status: "published", category: { $type: "string", $ne: "" } } },
      { $group: { _id: "$category" } },
    ]),
    Article.aggregate<{ _id: string }>([
      { $match: { status: "published", tags: { $exists: true, $ne: [] } } },
      { $unwind: "$tags" },
      { $match: { tags: { $type: "string", $ne: "" } } },
      { $group: { _id: "$tags" } },
    ]),
    Anime.find({}).select({ slug: 1, updatedAt: 1 }).lean(),
  ]);

  const articleRoutes = articles.map((article) => ({
    url: absoluteUrl(`/article/${article.slug}`),
    lastModified: article.updatedAt || article.publishedAt || new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const categoryRoutes = categoryRows.map((category) => ({
    url: absoluteUrl(`/category/${category._id}`),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const tagRoutes = tagRows.map((tag) => ({
    url: absoluteUrl(`/tag/${tag._id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`),
    changeFrequency: "daily" as const,
    priority: 0.65,
  }));

  const animeRoutes = animes.map((anime) => ({
    url: absoluteUrl(`/anime/${anime.slug}`),
    lastModified: anime.updatedAt || new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return staticRoutes.concat(articleRoutes, categoryRoutes, tagRoutes, animeRoutes);
}