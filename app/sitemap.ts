import type { MetadataRoute } from "next";

import { connectToDatabase } from "@/lib/mongodb";
import { absoluteUrl } from "@/lib/seo";
import Article from "@/models/Article";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "hourly", priority: 1 },
    { url: absoluteUrl("/news"), changeFrequency: "hourly", priority: 0.9 },
    { url: absoluteUrl("/admin"), changeFrequency: "weekly", priority: 0.3 },
  ];

  if (!process.env.MONGODB_URI) {
    return staticRoutes;
  }

  await connectToDatabase();

  const articles = await Article.find({ status: "published" })
    .select({ slug: 1, updatedAt: 1, publishedAt: 1 })
    .sort({ publishedAt: -1, updatedAt: -1 })
    .lean();

  return staticRoutes.concat(
    articles.map((article) => ({
      url: absoluteUrl(`/news/${article.slug}`),
      lastModified: article.updatedAt || article.publishedAt || new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    })),
  );
}