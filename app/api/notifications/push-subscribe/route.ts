import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { isWebPushConfigured } from "@/lib/webPush";
import Anime from "@/models/Anime";
import WebPushSubscription from "@/models/WebPushSubscription";

type PushSubscriptionPayload = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function POST(request: NextRequest) {
  if (!isWebPushConfigured()) {
    return NextResponse.json({ error: "Web push is not configured." }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  const animeSlugs = Array.isArray(payload?.animeSlugs)
    ? payload.animeSlugs.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
    : [];
  const subscription = payload?.subscription as PushSubscriptionPayload | undefined;

  if (!animeSlugs.length) {
    return NextResponse.json({ error: "Select at least one anime." }, { status: 400 });
  }

  if (!subscription?.endpoint || !subscription?.keys?.auth || !subscription?.keys?.p256dh) {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  await connectToDatabase();

  const animes = await Anime.find({ slug: { $in: animeSlugs }, notificationsEnabled: { $ne: false } })
    .select({ slug: 1 })
    .lean();
  const validAnimeSlugs = Array.from(new Set(animes.map((anime) => anime.slug)));

  if (!validAnimeSlugs.length) {
    return NextResponse.json({ error: "No eligible anime found for notifications." }, { status: 400 });
  }

  await WebPushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    {
      $set: {
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime ?? null,
        keys: {
          auth: subscription.keys.auth,
          p256dh: subscription.keys.p256dh,
        },
        animeSlugs: validAnimeSlugs,
        locale: typeof payload?.locale === "string" ? payload.locale : undefined,
        sourcePage: typeof payload?.sourcePage === "string" ? payload.sourcePage : undefined,
        userAgent: request.headers.get("user-agent") || undefined,
        active: true,
      },
    },
    { upsert: true, new: true },
  ).lean();

  return NextResponse.json({ ok: true, count: validAnimeSlugs.length });
}