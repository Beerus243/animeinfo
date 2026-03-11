import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { ensureUniqueArticleSlug } from "@/lib/articleDrafts";
import { connectToDatabase } from "@/lib/mongodb";
import Article from "@/models/Article";

export async function POST(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  if (!payload?.id || !payload?.title) {
    return NextResponse.json({ error: "Missing article id or title." }, { status: 400 });
  }

  await connectToDatabase();

  const slug = await ensureUniqueArticleSlug(payload.title, { excludeId: payload.id });

  const section = payload.section === "recommendation" ? "recommendation" : "news";
  const recommendationType =
    section === "recommendation" && (payload.recommendationType === "anime" || payload.recommendationType === "manga")
      ? payload.recommendationType
      : undefined;

  const article = await Article.findByIdAndUpdate(
    payload.id,
    {
      $set: {
        title: payload.title,
        slug,
        excerpt: payload.excerpt,
        content: payload.content,
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
          metaTitle: payload.seo?.metaTitle,
          metaDesc: payload.seo?.metaDesc,
          ogImage: payload.seo?.ogImage,
        },
        status: "review",
      },
      ...(section === "news" ? { $unset: { recommendationType: 1 } } : {}),
    },
    { new: true },
  ).lean();

  return NextResponse.json({ ok: true, article });
}