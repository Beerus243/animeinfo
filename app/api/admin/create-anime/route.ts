import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { ensureUniqueAnimeSlug } from "@/lib/animeAdmin";
import { connectToDatabase } from "@/lib/mongodb";
import Anime from "@/models/Anime";

export async function POST(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const title = "Nouvel anime";
  const slug = await ensureUniqueAnimeSlug(title);
  const anime = await Anime.create({
    title,
    slug,
    synopsis: "",
    genres: [],
    tags: [],
    seasons: [],
    status: "upcoming",
    currentSeasonLabel: "",
    releaseDay: "",
    popularityScore: 0,
    isPopularNow: false,
    notificationsEnabled: true,
  });

  return NextResponse.json({ ok: true, animeId: anime._id.toString() });
}