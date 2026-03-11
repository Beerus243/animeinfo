## AnimeInfo

AnimeInfo is a Next.js App Router editorial stack for an anime news site with RSS imports, draft-first publishing, SEO helpers, Cloudinary uploads, and ad-readiness.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- MongoDB via Mongoose
- Cloudinary signed uploads
- RSS ingestion via `rss-parser`

## Getting Started

1. Install dependencies.
2. Copy `.env.example` into `.env.local` and fill in the values.
3. Set the admin and cron secrets.
4. Start the development server.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev`: start development server
- `npm run build`: production build
- `npm run start`: start production server
- `npm run lint`: run ESLint
- `npm run import:example`: run the local RSS import script

## Project Areas

- `app/`: App Router pages, route handlers, UI components
- `lib/`: database, RSS, SEO, ads, Cloudinary helpers
- `models/`: Mongoose schemas
- `scripts/`: local utilities
- `infra/`: deployment and scheduling configuration
- `docs/`: operational documentation

## Workflow

1. News RSS and recommendation RSS sources are imported into MongoDB as drafts.
2. Admin users review and enrich drafts.
3. Published articles get metadata, canonical URLs, and structured data.
4. Ad units are only enabled once consent and provider configuration are available.

## RSS Streams

- `RSS_SOURCES`: standard anime news feeds
- `RSS_RECOMMENDATION_ANIME_SOURCES`: recommendation-oriented anime feeds
- `RSS_RECOMMENDATION_MANGA_SOURCES`: recommendation-oriented manga feeds
- `ANIME_AIRING_FEEDS`: catalog feeds used to auto-sync airing anime entries
- `ANIME_UPCOMING_FEEDS`: catalog feeds used to auto-sync upcoming anime entries
- `VOIRANIME_BASE_URL`: optional override for the Voiranime base URL used by the scraper/feed connector
- `VOIRANIME_GENRE_SLUGS`: optional override for the genre feeds used to enrich trend snapshots

Recommendation imports are stored as a dedicated editorial section so they can be published into the public recommendations hub.
Anime catalog imports are also wired into the scheduled cron flow, so `/api/cron/import-news` now tries to refresh airing/upcoming anime entries automatically.
The same cron route also stores RSS trend snapshots so public discovery surfaces can reuse recent feed signals even when live feeds are sparse.
Voiranime is now integrated automatically in two ways: genre archive feeds enrich trend/category discovery, and a controlled HTML import fills airing/upcoming anime when `voiranime://airing` or `voiranime://upcoming` are present in the anime feed lists.

Validated public feeds in this environment:

- `https://myanimelist.net/rss.php?type=season`
- `https://myanimelist.net/rss.php?type=upcoming`
- `https://myanimelist.net/rss.php?type=recommendations`
- `https://www.animenewsnetwork.com/news/rss.xml`
- `https://v6.voiranime.com/anime-genre/<slug>/feed/`

Not retained because they failed validation here:

- AniList RSS endpoints returned HTML instead of RSS.
- Anime-Planet RSS endpoints returned `403`.
- `https://www.animenewsnetwork.com/reviews/rss.xml` returned `404`.
- Voiranime does not expose a reliable native RSS for the full `en cours` or `prochainement` listings, so those sections are imported via HTML parsing instead of XML.

## Anime Release Tracking

- `/airing`: public hub for currently airing anime and popular titles.
- `/admin/anime`: admin workspace to manage airing metadata, popularity, and visitor notification eligibility.
- `NotificationSubscription`: MongoDB collection that stores visitor alert subscriptions.

Release-alert delivery can be enabled with:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Without those variables, subscriptions are stored but no email is sent.

## Admin And Cron Auth

- `ADMIN_EMAIL`: email used on `/admin/login`
- `ADMIN_PASSWORD`: password used on `/admin/login`
- `ADMIN_SESSION_SECRET`: HMAC secret used to sign the admin session cookie
- `CRON_SECRET`: dedicated bearer token or query token for `/api/cron/import-news`

Use a different value for `CRON_SECRET` than the admin password. The admin interface now uses session auth only; `ADMIN_TOKEN` is no longer used.

## Deployment Notes

- Vercel can call the cron import route on a schedule.
- MongoDB Atlas should be configured with backups and network access rules.
- Cloudinary credentials are required for signed uploads.
- Ad providers and analytics remain disabled until the matching environment variables are set.

See `docs/` for ad setup, SEO guidance, and operations runbook.