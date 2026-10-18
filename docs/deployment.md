# Deployment

Omnivix runs on Vercel. This page covers what a deployment needs beyond the [local setup](../README.md#getting-started).

## Environment variables

| Variable                          | Needed                          | What it's for                                                                                    |
| --------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------ |
| `GITHUB_TOKEN`                    | For the GitHub templates        | Reads public data: a classic token with no scopes, or a fine-grained one with public read access |
| `EXPORT_TOKEN_SECRET`             | On Vercel                       | Signs the short-lived export tokens; use a long random string                                    |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Only with Deployment Protection | Lets the export open `/render` (see [below](#deployment-protection))                             |

Set `GITHUB_TOKEN` and `EXPORT_TOKEN_SECRET` for both the **Production** and the **Preview** environments, or exports and GitHub data fail on preview deployments.

Without `EXPORT_TOKEN_SECRET`, each server process makes up a random secret. That works for one process (such as `pnpm dev`), but on Vercel the export page can run in another instance than the API route, so the export fails.

`VERCEL_PROJECT_PRODUCTION_URL` and `VERCEL_URL` are set by Vercel automatically, and are used for absolute URLs in metadata and for the export's render URL.

## Deployment Protection

If Deployment Protection is on (usually for Preview), the export's headless browser can't open `/render` without a bypass. Enable _Protection Bypass for Automation_ under **Settings → Deployment Protection**, and Vercel sets `VERCEL_AUTOMATION_BYPASS_SECRET`.

## Export rate limit

Exports are rate limited by a Vercel Firewall rule, not in the code:

| Name               | Path               | Limit                         | Action      |
| ------------------ | ------------------ | ----------------------------- | ----------- |
| Rate limit exports | `POST /api/export` | 30 requests per 10 min per IP | Answers 429 |

Add it in the Vercel dashboard (Firewall) or with `vercel firewall rules`. A fork has no limit until it adds one. The studio shows a `429` without GitHub's reset time as an export limit (`src/lib/rateLimitMessage.ts`).

## Chromium

Locally, the export uses Playwright's own Chromium (`pnpm exec playwright install chromium`). On Vercel it uses `@sparticuz/chromium`. When upgrading `playwright`, upgrade `@sparticuz/chromium` to the matching Chromium version in the same PR; a mismatch breaks export on Vercel only.
