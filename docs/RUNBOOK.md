# Runbook

## Vercel environment

Set these variables in the Vercel project before the first production deployment:

- `MONGODB_URI`
- `RSS_SOURCES`
- `SITE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `CRON_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_URL`

Recommendations:

- Use a long random value for `ADMIN_SESSION_SECRET`.
- Keep `CRON_SECRET` different from `ADMIN_PASSWORD`.
- Set `SITE_URL` to the final public domain.
- Mirror the same variables in Preview only when you want preview deployments to use the live database and media account.

## Import operations

- Vercel cron calls `/api/cron/import-news` every 30 minutes.
- When `CRON_SECRET` is set in Vercel, the platform sends `Authorization: Bearer <CRON_SECRET>` to cron invocations automatically.
- Manual import can be triggered with `npm run import:example`.

## Backups

- Enable MongoDB Atlas scheduled snapshots.
- Restrict database access with Atlas network rules.

## Incident handling

- Review cron response payloads for `failures` and `duplicates`.
- Add Sentry or another log sink before production launch.