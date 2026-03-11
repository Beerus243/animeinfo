import { NextRequest, NextResponse } from "next/server";

import {
  buildImportedArticleKey,
  buildManualDraftOriginalUrl,
  buildManualDraftTitle,
  ensureUniqueArticleSlug,
  type EditorialSection,
  type RecommendationKind,
} from "@/lib/articleDrafts";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { connectToDatabase } from "@/lib/mongodb";
import Article from "@/models/Article";

function normalizeSection(value: unknown): EditorialSection {
  return value === "recommendation" ? "recommendation" : "news";
}

function normalizeRecommendationType(value: unknown, section: EditorialSection): RecommendationKind {
  if (section !== "recommendation") {
    return null;
  }

  return value === "manga" ? "manga" : "anime";
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await request.json().catch(() => ({}))
    : Object.fromEntries(await request.formData().catch(() => new FormData()));
  const section = normalizeSection(payload?.section);
  const recommendationType = normalizeRecommendationType(payload?.recommendationType, section);
  const title = buildManualDraftTitle(section, recommendationType);

  await connectToDatabase();

  const slug = await ensureUniqueArticleSlug(title);
  const originalUrl = buildManualDraftOriginalUrl(section, recommendationType);
  const article = await Article.create({
    title,
    slug,
    originalTitle: title,
    originalUrl,
    importKey: buildImportedArticleKey(originalUrl, section, recommendationType ?? undefined),
    excerpt: "",
    content: "",
    category: section === "recommendation" ? "Recommendations" : "Actualites",
    tags: section === "recommendation" ? ["recommendation", recommendationType].filter(Boolean) : [],
    section,
    recommendationType: recommendationType ?? undefined,
    status: "draft",
    sourceName: "manual",
    seo: {
      metaTitle: title,
      metaDesc: "",
      ogImage: "",
    },
  });

  return NextResponse.json({ ok: true, articleId: article._id.toString() });
}