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

  const frTitle = localizations.fr.title || preferredLocalization.title;
  const frSlug = await ensureUniqueArticleSlug(frTitle || preferredLocalization.title, { excludeId: payload.id });
  const enSlug = localizations.en.title
    ? await ensureUniqueArticleSlug(localizations.en.title, { excludeId: payload.id, reservedSlugs: [frSlug] })
    : "";
  const localizationsWithSlugs = {
    fr: {
      ...localizations.fr,
      slug: frSlug,
    },
    en: {
      ...localizations.en,
      slug: enSlug,
    },
  };

  const section = payload.section === "recommendation" ? "recommendation" : "news";
  const recommendationType =
    section === "recommendation" && (payload.recommendationType === "anime" || payload.recommendationType === "manga")
      ? payload.recommendationType
      : undefined;

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
        status: "review",
      },
      ...(section === "news" ? { $unset: { recommendationType: 1 } } : {}),
    },
    { new: true },
  ).lean();

  return NextResponse.json({ ok: true, article });
}