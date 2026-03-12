import type { PushSubscription } from "web-push";

import { absoluteUrl } from "@/lib/seo";
import { isNotificationDeliveryConfigured, sendReleaseAlertEmail } from "@/lib/notifications";
import { isWebPushConfigured, sendWebPushNotification } from "@/lib/webPush";
import { connectToDatabase } from "@/lib/mongodb";
import Anime from "@/models/Anime";
import NotificationDeliveryLog from "@/models/NotificationDeliveryLog";
import NotificationSubscription from "@/models/NotificationSubscription";
import WebPushSubscription from "@/models/WebPushSubscription";

type DueAnime = {
  slug: string;
  title: string;
  nextEpisodeAt: Date;
};

function buildDeliveryKey(anime: DueAnime) {
  return `${anime.slug}::${anime.nextEpisodeAt.toISOString()}`;
}

async function getPendingAnimeDeliveries(channel: "email" | "push", recipientKey: string, dueAnimes: DueAnime[]) {
  if (!dueAnimes.length) {
    return [];
  }

  const logs = await NotificationDeliveryLog.find({
    channel,
    recipientKey,
    animeSlug: { $in: dueAnimes.map((anime) => anime.slug) },
    episodeAt: { $in: dueAnimes.map((anime) => anime.nextEpisodeAt) },
  })
    .select({ animeSlug: 1, episodeAt: 1 })
    .lean();

  const sentKeys = new Set(logs.map((log) => `${log.animeSlug}::${new Date(log.episodeAt).toISOString()}`));
  return dueAnimes.filter((anime) => !sentKeys.has(buildDeliveryKey(anime)));
}

async function recordDeliveryLogs(channel: "email" | "push", recipientKey: string, dueAnimes: DueAnime[]) {
  if (!dueAnimes.length) {
    return;
  }

  await NotificationDeliveryLog.insertMany(
    dueAnimes.map((anime) => ({
      channel,
      recipientKey,
      animeSlug: anime.slug,
      episodeAt: anime.nextEpisodeAt,
      sentAt: new Date(),
    })),
    { ordered: false },
  ).catch(() => undefined);
}

function buildPushPayload(dueAnimes: DueAnime[]) {
  const single = dueAnimes.length === 1 ? dueAnimes[0] : null;
  const title = single ? `${single.title} sort bientot` : "Nouvelles sorties anime a venir";
  const body = single
    ? `Le prochain episode de ${single.title} approche. Ouvre la fiche pour suivre la sortie.`
    : `Les prochains episodes de ${dueAnimes.slice(0, 2).map((anime) => anime.title).join(", ")} arrivent bientot.`;

  return {
    title,
    body,
    url: single ? `/anime/${single.slug}` : "/airing",
    tag: single ? `release-${single.slug}` : "release-airing",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
  };
}

export function hasAnyReleaseDeliveryChannel() {
  return isNotificationDeliveryConfigured() || isWebPushConfigured();
}

export async function sendDueReleaseAlerts() {
  await connectToDatabase();

  const horizon = new Date(Date.now() + 1000 * 60 * 60 * 72);
  const dueAnimeRows = await Anime.find({
    notificationsEnabled: { $ne: false },
    status: "airing",
    nextEpisodeAt: { $exists: true, $ne: null, $lte: horizon },
  })
    .select({ slug: 1, title: 1, nextEpisodeAt: 1 })
    .lean();

  const dueAnimes: DueAnime[] = dueAnimeRows
    .filter((anime): anime is typeof anime & { nextEpisodeAt: Date } => Boolean(anime.slug && anime.title && anime.nextEpisodeAt))
    .map((anime) => ({
      slug: anime.slug,
      title: anime.title,
      nextEpisodeAt: new Date(anime.nextEpisodeAt),
    }));

  if (!dueAnimes.length) {
    return {
      sent: 0,
      emailSent: 0,
      pushSent: 0,
      emailSubscriptions: 0,
      pushSubscriptions: 0,
      failures: [] as Array<{ channel: "email" | "push"; recipient: string; error: string }>,
      message: "No due anime releases found.",
    };
  }

  const dueAnimeMap = new Map(dueAnimes.map((anime) => [anime.slug, anime]));
  const failures: Array<{ channel: "email" | "push"; recipient: string; error: string }> = [];
  let emailSent = 0;
  let pushSent = 0;
  let emailSubscriptions = 0;
  let pushSubscriptions = 0;

  if (isNotificationDeliveryConfigured()) {
    const emailRows = await NotificationSubscription.find({
      active: true,
      notifyOnRelease: true,
      animeSlugs: { $in: dueAnimes.map((anime) => anime.slug) },
    }).lean();

    emailSubscriptions = emailRows.length;

    for (const subscription of emailRows) {
      const matchingAnimes = (subscription.animeSlugs || [])
        .map((slug) => dueAnimeMap.get(slug))
        .filter((anime): anime is DueAnime => Boolean(anime));
      const pendingAnimes = await getPendingAnimeDeliveries("email", subscription.email, matchingAnimes);

      if (!pendingAnimes.length) {
        continue;
      }

      try {
        await sendReleaseAlertEmail({
          to: subscription.email,
          animeTitles: pendingAnimes.map((anime) => anime.title),
        });
        await recordDeliveryLogs("email", subscription.email, pendingAnimes);
        await NotificationSubscription.updateOne(
          { _id: subscription._id },
          { $set: { lastNotifiedAt: new Date() } },
        );
        emailSent += 1;
      } catch (error) {
        failures.push({
          channel: "email",
          recipient: subscription.email,
          error: error instanceof Error ? error.message : "Unknown email delivery error",
        });
      }
    }
  }

  if (isWebPushConfigured()) {
    const pushRows = await WebPushSubscription.find({
      active: true,
      animeSlugs: { $in: dueAnimes.map((anime) => anime.slug) },
    }).lean();

    pushSubscriptions = pushRows.length;

    for (const subscription of pushRows) {
      if (!subscription.keys?.auth || !subscription.keys?.p256dh) {
        await WebPushSubscription.updateOne({ _id: subscription._id }, { $set: { active: false } });
        failures.push({
          channel: "push",
          recipient: subscription.endpoint,
          error: "Stored push subscription is missing encryption keys.",
        });
        continue;
      }

      const matchingAnimes = (subscription.animeSlugs || [])
        .map((slug) => dueAnimeMap.get(slug))
        .filter((anime): anime is DueAnime => Boolean(anime));
      const pendingAnimes = await getPendingAnimeDeliveries("push", subscription.endpoint, matchingAnimes);

      if (!pendingAnimes.length) {
        continue;
      }

      try {
        await sendWebPushNotification(
          {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expirationTime ?? null,
            keys: {
              auth: subscription.keys.auth,
              p256dh: subscription.keys.p256dh,
            },
          } as PushSubscription,
          buildPushPayload(pendingAnimes),
        );
        await recordDeliveryLogs("push", subscription.endpoint, pendingAnimes);
        await WebPushSubscription.updateOne(
          { _id: subscription._id },
          { $set: { lastNotifiedAt: new Date(), active: true } },
        );
        pushSent += 1;
      } catch (error) {
        const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : undefined;
        if (statusCode === 404 || statusCode === 410) {
          await WebPushSubscription.updateOne({ _id: subscription._id }, { $set: { active: false } });
        }

        failures.push({
          channel: "push",
          recipient: subscription.endpoint,
          error: error instanceof Error ? error.message : "Unknown push delivery error",
        });
      }
    }
  }

  return {
    sent: emailSent + pushSent,
    emailSent,
    pushSent,
    emailSubscriptions,
    pushSubscriptions,
    failures,
  };
}