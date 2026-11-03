# Deployment

[omnivix.vercel.app](https://omnivix.vercel.app) runs on Vercel. Here's how it's set up, and what differs from running it locally.

## Environment variables

Locally, Omnivix needs only a GitHub token. On Vercel it needs four more.

### Local

- `GITHUB_TOKEN`: reads public GitHub data

The export works without its two secrets, because everything runs in one process that makes up its own secret, and nothing is behind a login. Without the Redis variables there's no rate limit.

### Vercel

**Production** is the live site, built from `main`. **Preview** deployments are built for all other branches and pull requests. Both use the same variables:

- `GITHUB_TOKEN`
- `EXPORT_TOKEN_SECRET`
- `VERCEL_AUTOMATION_BYPASS_SECRET` (set by Vercel)
- `KV_REST_API_URL` and `KV_REST_API_TOKEN` (set by Upstash, for the [rate limit](#rate-limits))

To [export](architecture.md#export-flow) a banner, the server opens it in a headless browser and screenshots it. The banner's settings reach that browser in a short-lived token, signed with `EXPORT_TOKEN_SECRET`. The request and the screenshot can run on different servers, so both need the same secret.

Preview deployments are also behind a Vercel login. The headless browser isn't logged in, so it sends `VERCEL_AUTOMATION_BYPASS_SECRET` to get through.

## Chromium

Locally, the export uses Playwright's own Chromium, and on Vercel it uses `@sparticuz/chromium`. Their versions must match, so upgrade both in the same PR.

## Rate limits

Per IP, answered with `429`:

- `POST /api/export`: 30 per 10 minutes, a Vercel Firewall rule, and 25 per UTC day (`EXPORT_DAILY_LIMIT`), counted in Upstash Redis
- `/api/github/*`: 60 per 10 minutes, counted in Upstash Redis
