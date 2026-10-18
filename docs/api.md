# API

Want a banner without opening the studio, or a link that opens the studio with your settings? Both work without a key or sign-in.

## Export API

`POST /api/export` returns a banner as an image. Send `templateId`, `size` and `state`, the template's settings; settings you leave out use the template's defaults. `pixelRatio`, `format` and `uiTheme` are optional.

```sh
curl -X POST https://omnivix.vercel.app/api/export \
  -H "Content-Type: application/json" \
  -d '{"templateId":"github-banner","size":"wide","state":{"username":"octocat"}}' \
  -o banner.png
```

Every template's settings, the sizes and the built-in backgrounds are listed in [`/llms.txt`](https://omnivix.vercel.app/llms.txt), which is generated from the code, so it always matches what the API accepts.

The API answers with:

- `200`: the image, as PNG or JPEG
- `400`: an invalid request, with an `issues` list naming each field that failed
- `404`: a GitHub user that doesn't exist
- `429`: a rate limit, either GitHub's (with a `resetAt` time) or the [export limit](deployment.md#export-rate-limit)
- `500`: a failed export; trying again may work

## Studio links

The studio reads the same settings from the URL, so a link can open a banner that's still adjustable:

```
https://omnivix.vercel.app/studio/contribution-banner?username=octocat&size=header&themeId=sunset
```

Values that aren't valid are ignored. Uploaded backgrounds can't be linked.

## Routes

All routes, including the ones the app uses internally:

| Route                                                      | Purpose                                         |
| ---------------------------------------------------------- | ----------------------------------------------- |
| `/`                                                        | Landing page                                    |
| `/studio/[templateId]`                                     | The editor for one template                     |
| `/render/[templateId]`                                     | The page the export screenshots; needs a token  |
| `POST /api/export`                                         | The export API above                            |
| `/api/github/user-summary`, `/contributions`, `/repos`     | GitHub data for the studio                      |
| `/opengraph-image`, `/studio/[templateId]/opengraph-image` | Link-preview images, generated at build time    |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt`                 | Crawl rules, sitemap and a summary for AI tools |
