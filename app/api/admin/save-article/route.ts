import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { ensureUniqueArticleSlug } from "@/lib/articleDrafts";
import { buildArticleLocalizations, resolveArticleLocalization } from "@/lib/articleLocalization";
import { connectToDatabase } from "@/lib/mongodb";
import Article from "@/models/Article";

export async function POST(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const localizations = buildArticleLocalizations(payload?.localizations);
  const preferredLocalization = resolveArticleLocalization(
    {
      title: payload?.title,
      excerpt: payload?.excerpt,
      content: payload?.content,
      seo: payload?.seo,
      localizations,
    },
    "fr",
  );

  if (!payload?.id || !preferredLocalization.title) {
    return NextResponse.json({ error: "Missing article id or localized title." }, { status: 400 });
  }

  await connectToDatabase();

  const existingArticle = await Article.findById(payload.id)
    .select({ status: 1, publishedAt: 1 })
    .lean();

  if (!existingArticle) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  const frTitle = localizations.fr.title || preferredLocalization.title;
  const frSlug = await ensureUniqueArticleSlug(frTitle || preferredLocalization.title, { excludeId: payload.id });
  const localizationsWithSlugs = {
    fr: {
      ...localizations.fr,
      slug: frSlug,
    },
  };

  const section = payload.section === "recommendation" ? "recommendation" : "news";
  const recommendationType =
    section === "recommendation" && (payload.recommendationType === "anime" || payload.recommendationType === "manga" || payload.recommendationType === "webtoon" || payload.recommendationType === "culture")
      ? payload.recommendationType
      : undefined;
  const nextStatus = existingArticle.status === "published" ? "published" : "review";

  const article = await Article.findByIdAndUpdate(
    payload.id,
    {
      $set: {
        title: preferredLocalization.title,
        localizations: localizationsWithSlugs,
        slug: frSlug,
        excerpt: preferredLocalization.excerpt,
        content: preferredLocalization.content,
        category: payload.category,
        anime: payload.anime,
        tags: String(payload.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        coverImage: payload.coverImage,
        section,
        recommendationType,
        seo: {
          metaTitle: preferredLocalization.seo.metaTitle,
          metaDesc: preferredLocalization.seo.metaDesc,
          ogImage: preferredLocalization.seo.ogImage,
        },
        aiRewritten: Boolean(payload.aiRewritten),
        status: nextStatus,
        ...(existingArticle.status === "published" ? { publishedAt: existingArticle.publishedAt || new Date() } : {}),
      },
      ...(section === "news" ? { $unset: { recommendationType: 1 } } : {}),
    },
    { new: true },
  ).lean();

  return NextResponse.json({ ok: true, article });
}