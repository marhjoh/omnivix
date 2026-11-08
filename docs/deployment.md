# Deployment

[omnivix.vercel.app](https://omnivix.vercel.app) runs on Vercel. Here's how it's set up, and what differs from running it locally.

## Environment variables

Locally, Omnivix needs only a GitHub token. Vercel also needs export secrets and Redis credentials.

### Local

- `GITHUB_TOKEN`: reads public GitHub data

The export works without its two secrets, because everything runs in one process that makes up its own secret, and nothing is behind a login. Without the Redis variables there's no rate limit.

### Vercel

**Production** is the live site, built from `main`. **Preview** deployments are built for all other branches and pull requests. Both use the same variables:

- `GITHUB_TOKEN`
- `EXPORT_TOKEN_SECRET`
- `VERCEL_AUTOMATION_BYPASS_SECRET` (set by Vercel)
- `VERCEL_ENV`
- `KV_REST_API_URL` and `KV_REST_API_TOKEN`

`EXPORT_TOKEN_SECRET` signs the [export](architecture.md#export-flow) settings. Use the same secret across server instances.

`VERCEL_AUTOMATION_BYPASS_SECRET` lets the export browser access protected previews.

Vercel sets `VERCEL_ENV` to separate rate-limit counters by environment.

Upstash provides `KV_REST_API_URL` and `KV_REST_API_TOKEN` for Redis-backed [rate limits](#rate-limits).

## Chromium

Locally, the export uses Playwright's own Chromium, and on Vercel it uses `@sparticuz/chromium`. Their versions must match, so upgrade both in the same PR.

## Rate limits

Per IP, answered with `429`:

- `POST /api/export`: 30 per 10 minutes, a Vercel Firewall rule, and 25 per UTC day (`EXPORT_DAILY_LIMIT`), counted in Upstash Redis
- `/api/github/*`: 60 per 10 minutes, counted in Upstash Redis
- `/api/feed`: 30 per 10 minutes, counted in Upstash Redis

`/api/icons` has no limit. It reads icons bundled with the app, and the CDN caches the answers.

Per banner: [image URLs](api.md#image-url) (`/banner/*`) render at most 30 times per UTC day per GitHub username, or per banner without one, in Upstash Redis. It isn't per IP because README images all come through GitHub's image proxy. Cached copies don't count.
