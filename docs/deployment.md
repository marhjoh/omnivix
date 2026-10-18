# Deployment

[omnivix.vercel.app](https://omnivix.vercel.app) runs on Vercel, configured as below.

## Environment variables

Set for both Production and Preview:

| Variable                          | Purpose                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `GITHUB_TOKEN`                    | Reads public GitHub data                                                                                            |
| `EXPORT_TOKEN_SECRET`             | Signs the export tokens; without it, exports fail ([why](architecture.md#export-flow))                              |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Lets the export open `/render` on protected Preview deployments; set by enabling _Protection Bypass for Automation_ |

## Firewall

- **Rate limit exports:** `POST /api/export`, 30 requests per 10 minutes per IP, answers `429`.

## Chromium

Locally, the export uses Playwright's own Chromium. On Vercel it uses `@sparticuz/chromium`. When upgrading `playwright`, upgrade `@sparticuz/chromium` to the matching Chromium version in the same PR; a mismatch breaks export on Vercel only.
