import { formatDateTime, getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import Anime from "@/models/Anime";
import NotificationSubscription from "@/models/NotificationSubscription";
import WebPushSubscription from "@/models/WebPushSubscription";

export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  await connectToDatabase();

  const [subscriptions, pushSubscriptions] = await Promise.all([
    NotificationSubscription.find({ active: true })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean(),
    WebPushSubscription.find({ active: true })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean(),
  ]);

  const animeSlugs = Array.from(new Set([
    ...subscriptions.flatMap((subscription) => subscription.animeSlugs || []),
    ...pushSubscriptions.flatMap((subscription) => subscription.animeSlugs || []),
  ]));
  const animes = await Anime.find({ slug: { $in: animeSlugs } }).select({ slug: 1, title: 1 }).lean();
  const animeMap = new Map(animes.map((anime) => [anime.slug, anime.title]));
  const hasAnySubscriptions = subscriptions.length > 0 || pushSubscriptions.length > 0;

  return (
    <div className="shell-container py-8 md:py-12">
      <section className="panel px-5 py-6 md:px-10 md:py-12">
        <span className="eyebrow">{messages.adminSubscribers.eyebrow}</span>
        <h1 className="mt-4 font-display text-3xl font-semibold md:mt-5 md:text-5xl">{messages.adminSubscribers.title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted md:leading-7">{messages.adminSubscribers.description}</p>
        <div className="mt-6 flex flex-wrap gap-2.5 text-sm text-muted md:gap-3">
          <span className="rounded-full border border-line px-3 py-2">{subscriptions.length} {messages.adminSubscribers.emailCountLabel}</span>
          <span className="rounded-full border border-line px-3 py-2">{pushSubscriptions.length} {messages.adminSubscribers.pushCountLabel}</span>
        </div>
      </section>

      {subscriptions.length ? (
        <div className="grid-auto-fit mt-8">
          {subscriptions.map((subscription) => {
            const followedTitles = (subscription.animeSlugs || []).map((slug) => animeMap.get(slug) || slug);

            return (
              <article key={subscription._id.toString()} className="content-card p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold md:text-2xl break-all">{subscription.email}</h2>
                  <span className="rounded-full border border-line px-3 py-2 text-sm text-muted">
                    {messages.adminSubscribers.channelEmail}
                  </span>
                  <span className="rounded-full border border-line px-3 py-2 text-sm text-muted">
                    {followedTitles.length} {messages.adminSubscribers.followedSuffix}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted">{messages.adminSubscribers.sourcePrefix} {subscription.sourcePage || "-"}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {followedTitles.map((title) => (
                    <span key={title} className="rounded-full bg-accent-soft px-3 py-2 text-sm font-medium text-accent">
                      {title}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-sm text-muted">
                  {messages.adminSubscribers.lastNotifiedPrefix} {subscription.lastNotifiedAt ? formatDateTime(locale, subscription.lastNotifiedAt) : messages.adminSubscribers.neverNotified}
                </p>
              </article>
            );
          })}
        </div>
      ) : null}

      {pushSubscriptions.length ? (
        <div className="grid-auto-fit mt-8">
          {pushSubscriptions.map((subscription) => {
            const followedTitles = (subscription.animeSlugs || []).map((slug) => animeMap.get(slug) || slug);

            return (
              <article key={subscription._id.toString()} className="content-card p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold md:text-2xl break-all">{subscription.endpoint}</h2>
                  <span className="rounded-full border border-line px-3 py-2 text-sm text-muted">{messages.adminSubscribers.channelPush}</span>
                </div>
                <p className="mt-3 text-sm text-muted">{messages.adminSubscribers.sourcePrefix} {subscription.sourcePage || "-"}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {followedTitles.map((title) => (
                    <span key={title} className="rounded-full bg-accent-soft px-3 py-2 text-sm font-medium text-accent">
                      {title}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-sm text-muted">
                  {messages.adminSubscribers.lastNotifiedPrefix} {subscription.lastNotifiedAt ? formatDateTime(locale, subscription.lastNotifiedAt) : messages.adminSubscribers.neverNotified}
                </p>
              </article>
            );
          })}
        </div>
      ) : null}

      {!hasAnySubscriptions ? (
        <div className="panel mt-8 p-6 text-muted">{messages.adminSubscribers.empty}</div>
      ) : null}
    </div>
  );
}