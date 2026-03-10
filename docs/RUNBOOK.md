# Runbook

## Import operations

- Vercel cron calls `/api/cron/import-news` every 30 minutes.
- Manual import can be triggered with `npm run import:example`.

## Backups

- Enable MongoDB Atlas scheduled snapshots.
- Restrict database access with Atlas network rules.

## Incident handling

- Review cron response payloads for `failures` and `duplicates`.
- Add Sentry or another log sink before production launch.