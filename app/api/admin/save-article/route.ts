import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { connectToDatabase } from "@/lib/mongodb";
import { slugify } from "@/lib/slugify";
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

  const article = await Article.findByIdAndUpdate(
    payload.id,
    {
      $set: {
        title: payload.title,
        slug: slugify(payload.title),
        excerpt: payload.excerpt,
        content: payload.content,
        category: payload.category,
        anime: payload.anime,
        tags: String(payload.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        coverImage: payload.coverImage,
        seo: {
          metaTitle: payload.seo?.metaTitle,
          metaDesc: payload.seo?.metaDesc,
          ogImage: payload.seo?.ogImage,
        },
        status: "review",
      },
    },
    { new: true },
  ).lean();

  return NextResponse.json({ ok: true, article });
}