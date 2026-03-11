import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { ensureUniqueAnimeSlug, normalizeAnimeStatus, normalizeTagList } from "@/lib/animeAdmin";
import { connectToDatabase } from "@/lib/mongodb";
import Anime from "@/models/Anime";

export async function POST(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  if (!payload?.id || !payload?.title) {
    return NextResponse.json({ error: "Missing anime id or title." }, { status: 400 });
  }

  await connectToDatabase();

  const slug = await ensureUniqueAnimeSlug(payload.slug || payload.title, { excludeId: payload.id });
  const anime = await Anime.findByIdAndUpdate(
    payload.id,
    {
      $set: {
        title: payload.title,
        slug,
        synopsis: payload.synopsis,
        coverImage: payload.coverImage,
        genres: normalizeTagList(payload.genres),
        tags: normalizeTagList(payload.tags),
        seasons: normalizeTagList(payload.seasons),
        status: normalizeAnimeStatus(payload.status),
        currentSeasonLabel: payload.currentSeasonLabel,
        releaseDay: payload.releaseDay,
        nextEpisodeAt: payload.nextEpisodeAt ? new Date(payload.nextEpisodeAt) : undefined,
        popularityScore: Number(payload.popularityScore || 0),
        isPopularNow: Boolean(payload.isPopularNow),
        notificationsEnabled: Boolean(payload.notificationsEnabled),
      },
    },
    { new: true },
  ).lean();

  return NextResponse.json({ ok: true, anime });
}