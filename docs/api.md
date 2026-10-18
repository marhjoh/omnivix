# API

The routes, the export API and studio links. Every template's settings, the banner sizes and the built-in backgrounds are listed in [`/llms.txt`](https://omnivix.vercel.app/llms.txt), which is generated from the code (`src/export/apiDocs.ts`) and so always matches what the API accepts.

## Routes

| Route                                                      | Purpose                                                                                       |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `/`                                                        | Landing page: hero, template showcase, how it works, FAQ                                      |
| `/studio/[templateId]`                                     | The editor for one template; query parameters prefill settings (`src/studio/linkSettings.ts`) |
| `/render/[templateId]`                                     | Headless page the export screenshots; needs a valid export token                              |
| `POST /api/export`                                         | Renders a banner and returns it as PNG or JPEG                                                |
| `/api/github/user-summary`, `/contributions`, `/repos`     | GitHub data for the studio (`/repos` returns both pinned and owned public repositories)       |
| `/opengraph-image`, `/studio/[templateId]/opengraph-image` | Link-preview images, generated at build time                                                  |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt`                 | Crawl rules, sitemap and a summary for AI assistants, including the export API                |

## Export API

`POST /api/export` with a JSON body returns the banner as an image. No key or sign-in is needed. `templateId`, `size` and `state` (the template's settings) are required, though settings left out of `state` use the template's defaults. `pixelRatio`, `format` and `uiTheme` are optional.

```sh
curl -X POST https://omnivix.vercel.app/api/export \
  -H "Content-Type: application/json" \
  -d '{"templateId":"github-banner","size":"wide","state":{"username":"octocat"}}' \
  -o banner.png
```

Responses:

- `200`: the image (`image/png` or `image/jpeg`).
- `400`: `{ "error": "…", "issues": [{ "path": "state.username", "message": "Required" }] }`, one issue per field that failed.
- `404`: the GitHub user doesn't exist.
- `429`: a rate limit. GitHub's comes with a `resetAt` time. The export limit, 30 per 10 minutes per IP address on omnivix.vercel.app, has none (see [deployment.md](deployment.md#firewall)).
- `500`: the export failed; trying again may work.

How an export is rendered is described in [architecture.md](architecture.md#export-flow).

## Studio links

To give someone a banner they can still adjust, link to the studio with the same settings as query parameters:

```
https://omnivix.vercel.app/studio/contribution-banner?username=octocat&size=header&themeId=sunset
```

The studio leaves out values that aren't valid and keeps the rest. Uploaded backgrounds can't be linked.
