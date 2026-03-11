import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { connectToDatabase } from "@/lib/mongodb";
import { isNotificationDeliveryConfigured, sendReleaseAlertEmail } from "@/lib/notifications";
import Anime from "@/models/Anime";
import NotificationSubscription from "@/models/NotificationSubscription";

export async function POST(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isNotificationDeliveryConfigured()) {
    return NextResponse.json({ error: "Missing RESEND_API_KEY or RESEND_FROM_EMAIL." }, { status: 400 });
  }

  await connectToDatabase();

  const horizon = new Date(Date.now() + 1000 * 60 * 60 * 72);
  const dueAnimes = await Anime.find({
    notificationsEnabled: { $ne: false },
    status: "airing",
    nextEpisodeAt: { $exists: true, $ne: null, $lte: horizon },
  })
    .select({ slug: 1, title: 1 })
    .lean();

  if (!dueAnimes.length) {
    return NextResponse.json({ ok: true, sent: 0, subscriptions: 0, message: "No due anime releases found." });
  }

  const dueAnimeMap = new Map(dueAnimes.map((anime) => [anime.slug, anime.title]));
  const subscriptions = await NotificationSubscription.find({
    active: true,
    animeSlugs: { $in: Array.from(dueAnimeMap.keys()) },
  }).lean();

  let sent = 0;
  const failures: Array<{ email: string; error: string }> = [];

  for (const subscription of subscriptions) {
    const matchingTitles = (subscription.animeSlugs || [])
      .map((slug) => dueAnimeMap.get(slug))
      .filter((title): title is string => Boolean(title));

    if (!matchingTitles.length) {
      continue;
    }

    try {
      await sendReleaseAlertEmail({
        to: subscription.email,
        animeTitles: matchingTitles,
      });
      await NotificationSubscription.updateOne(
        { _id: subscription._id },
        { $set: { lastNotifiedAt: new Date() } },
      );
      sent += 1;
    } catch (error) {
      failures.push({
        email: subscription.email,
        error: error instanceof Error ? error.message : "Unknown delivery error",
      });
    }
  }

  return NextResponse.json({ ok: true, sent, subscriptions: subscriptions.length, failures });
}