import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import Anime from "@/models/Anime";
import NotificationSubscription from "@/models/NotificationSubscription";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);

  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
  const animeSlugs = Array.isArray(payload?.animeSlugs)
    ? payload.animeSlugs.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
    : [];

  if (!email || !emailPattern.test(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  if (!animeSlugs.length) {
    return NextResponse.json({ error: "Select at least one anime." }, { status: 400 });
  }

  await connectToDatabase();

  const animes = await Anime.find({ slug: { $in: animeSlugs }, notificationsEnabled: { $ne: false } })
    .select({ slug: 1 })
    .lean();

  const validAnimeSlugs = Array.from(new Set(animes.map((anime) => anime.slug)));
  if (!validAnimeSlugs.length) {
    return NextResponse.json({ error: "No eligible anime found for notifications." }, { status: 400 });
  }

  const subscription = await NotificationSubscription.findOneAndUpdate(
    { email },
    {
      $set: {
        animeSlugs: validAnimeSlugs,
        locale: typeof payload?.locale === "string" ? payload.locale : undefined,
        sourcePage: typeof payload?.sourcePage === "string" ? payload.sourcePage : undefined,
        notifyOnRelease: true,
        active: true,
      },
    },
    { upsert: true, new: true },
  ).lean();

  return NextResponse.json({ ok: true, count: subscription?.animeSlugs?.length ?? validAnimeSlugs.length });
}