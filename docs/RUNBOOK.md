# Runbook

## Vercel environment

Set these variables in the Vercel project before the first production deployment:

- `MONGODB_URI`
- `RSS_SOURCES`
- `RSS_RECOMMENDATION_ANIME_SOURCES`
- `RSS_RECOMMENDATION_MANGA_SOURCES`
- `ANIME_AIRING_FEEDS`
- `ANIME_UPCOMING_FEEDS`
- `VOIRANIME_BASE_URL`
- `VOIRANIME_GENRE_SLUGS`
- `SITE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `CRON_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Recommendations:

- Use a long random value for `ADMIN_SESSION_SECRET`.
- Keep `CRON_SECRET` different from `ADMIN_PASSWORD`.
- Set `SITE_URL` to the final public domain.
- Mirror the same variables in Preview only when you want preview deployments to use the live database and media account.
- Set `RESEND_FROM_EMAIL` to a verified sender/domain in Resend before using release alerts.

## Import operations

- Vercel cron calls `/api/cron/import-news` every 30 minutes.
- When `CRON_SECRET` is set in Vercel, the platform sends `Authorization: Bearer <CRON_SECRET>` to cron invocations automatically.
- Manual import can be triggered with `npm run import:example`.
- Recommendation feeds use the same cron route and are classified automatically when `RSS_RECOMMENDATION_ANIME_SOURCES` or `RSS_RECOMMENDATION_MANGA_SOURCES` are set.
- Airing and upcoming anime feeds are also synced automatically during the same cron run when `ANIME_AIRING_FEEDS` or `ANIME_UPCOMING_FEEDS` are set.
- The same cron run also stores an RSS trend snapshot history used by `/trending` and `/explore`.
- `voiranime://airing` and `voiranime://upcoming` are supported pseudo-feeds for the anime importer; they scrape the public Voiranime listings and enrich entries with genres, synopsis, score, and season labels.
- Trend snapshots also include Voiranime genre archive feeds, either discovered from the homepage or read from `VOIRANIME_GENRE_SLUGS`.

## Public RSS routes

- `/rss/airing`: republishes the current airing catalog from MongoDB as RSS
- `/rss/trending`: republishes the latest saved trend snapshot as RSS
- `/rss/season`: republishes the current season anime bucket as RSS
- `/rss/categories`: republishes merged editorial categories and anime genres as RSS

These routes are internal to AnimeInfo and do not fetch Voiranime at request time; they publish the data already imported and stored by the cron/import pipeline.

Validated RSS endpoints:

- `https://myanimelist.net/rss.php?type=season`
- `https://myanimelist.net/rss.php?type=upcoming`
- `https://myanimelist.net/rss.php?type=recommendations`
- `https://www.animenewsnetwork.com/news/rss.xml`
- `https://v6.voiranime.com/anime-genre/<slug>/feed/`

Rejected during validation from this environment:

- AniList RSS URLs returned HTML pages.
- Anime-Planet RSS URLs returned `403` challenge pages.
- ANN reviews RSS URL returned `404`.
- Voiranime homepage/global feed did not provide usable `en cours` or `prochainement` item streams, so those are scraped from HTML instead.

## Release alerts

- Visitor subscriptions are created through `/api/notifications/subscribe`.
- Admin can manage anime metadata via `/admin/anime`.
- Admin can manually trigger delivery through `/api/admin/send-release-alerts`.
- The alert sender currently targets anime with `status="airing"` and `nextEpisodeAt` within the next 72 hours.
- Delivery uses Resend through `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.

## Backups

- Enable MongoDB Atlas scheduled snapshots.
- Restrict database access with Atlas network rules.

## Incident handling

- Review cron response payloads for `failures` and `duplicates`.
- Call `/api/health/db` on the deployed site to confirm whether the runtime sees `MONGODB_URI`, which host/db it resolves to, and whether MongoDB accepts the connection.
- Add Sentry or another log sink before production launch.