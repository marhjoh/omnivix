# Deployment

[omnivix.vercel.app](https://omnivix.vercel.app) runs on Vercel. Here's how it's set up, and what differs from running it locally.

## Environment variables

Locally, Omnivix needs only a GitHub token. On Vercel, the export needs two more secrets.

### Local

- `GITHUB_TOKEN`: reads public GitHub data

The export works without the other two, because everything runs in one process that makes up its own secret, and nothing is behind a login.

### Vercel

**Production** is the live site, built from `main`. **Preview** deployments are built for all other branches and pull requests. Both use the same variables:

- `GITHUB_TOKEN`
- `EXPORT_TOKEN_SECRET`
- `VERCEL_AUTOMATION_BYPASS_SECRET` (set by Vercel)

To [export](architecture.md#export-flow) a banner, the server opens it in a headless browser and screenshots it. The banner's settings reach that browser in a short-lived token, signed with `EXPORT_TOKEN_SECRET`. The request and the screenshot can run on different servers, so both need the same secret.

Preview deployments are also behind a Vercel login. The headless browser isn't logged in, so it sends `VERCEL_AUTOMATION_BYPASS_SECRET` to get through.

## Chromium

Locally, the export uses Playwright's own Chromium, and on Vercel it uses `@sparticuz/chromium`. Their versions must match, so upgrade both in the same PR.

## Export rate limit

A firewall rule allows 30 exports per 10 minutes per IP on `POST /api/export`, and answers `429` beyond that.
