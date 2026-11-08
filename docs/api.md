# API

Want a banner without opening the studio, an image to embed that stays up to date, or a link that opens the studio with your settings? All work without a key or sign-in.

## Export API

`POST /api/export` returns a banner as an image. Send `templateId`, `size` and `state`, the template's settings; settings you leave out use the template's defaults. `pixelRatio`, `format`, `uiTheme` and `transparent` are optional. `transparent: true` leaves out the theme's background color, for a PNG without a background image.

```sh
curl -X POST https://omnivix.vercel.app/api/export \
  -H "Content-Type: application/json" \
  -d '{"templateId":"github-banner","size":"wide","state":{"username":"marhjoh"}}' \
  -o banner.png
```

Every template's settings, the sizes and the built-in backgrounds are listed in [`/llms.txt`](https://omnivix.vercel.app/llms.txt), which is generated from the code, so it always matches what the API accepts.

The API answers with:

- `200`: the image, as PNG or JPEG
- `400`: an invalid request, with an `issues` list naming each field that failed, or an image that can't be used, with only an `error`
- `404`: a GitHub user that doesn't exist
- `413`: settings too long to export, such as a very long quote
- `429`: a rate limit: GitHub's (`"limit": "github"`) or the daily export quota (`"limit": "daily-exports"`), both with a `resetAt` time, or the [burst limit](deployment.md#rate-limits) without one
- `500`: a failed export; trying again may work

## Studio links

The studio reads the same settings from the URL, so a link can open a banner that's still adjustable:

```
https://omnivix.vercel.app/studio/contribution-banner?username=marhjoh&size=header&themeId=sunset
```

Values that aren't valid are ignored. Uploaded backgrounds and logos can't be linked. Positions are `x,y` in percent (`contentPosition=100,0`), `backgroundZoom` is a number from 1 to 1.5, and `backgroundOpacity` is a percent from 0 to 100.

## Image URL

`GET /banner/<templateId>.png`, or `.jpg` for JPEG, returns the banner as an image for a README or website. It takes the same query as a studio link, plus `pixelRatio` (`1` or `2`, default `2`), `uiTheme` (`light` or `dark`) and, for `.png` without a background image, `transparent=true`. To get a studio link's image URL, change its path:

```md
![Contribution Banner by @marhjoh](https://omnivix.vercel.app/banner/contribution-banner.png?username=marhjoh&size=header&themeId=sunset)
```

In the studio, the export panel's Copy group copies it as a link, Markdown or HTML.

- **Settings:** values that aren't valid use the defaults. Uploaded images can't go in a URL. Images stop at 2×, which is sharp on any screen and keeps photo banners small.
- **Caching:** an image is cached for a day (`s-maxage=86400`). After that, the old image is served while a new one renders (`stale-while-revalidate=604800`), so a README never waits on a render. Errors are cached for 5 minutes.
- **Limit:** 30 renders a day per GitHub username, or per banner for the quote and tech stack banners. Cached images don't count.

Responses are like the export API's:

- `200`: the image, `image/png` or `image/jpeg`
- `400`: settings it can't render, with `issues`: a GitHub banner without a valid `username`, or a format the size doesn't take (`.png` for `reddit`); or an image link that can't be used
- `404`: an unknown template or extension, or a GitHub user that doesn't exist
- `413`: settings too long to render
- `429`: the daily limit (`"limit": "banner-images"`) or GitHub's (`"limit": "github"`), with `resetAt` and `Retry-After`
- `500`: a failed render

## Routes

All routes, including the ones the app uses internally:

| Route                                                                    | Purpose                                         |
| ------------------------------------------------------------------------ | ----------------------------------------------- |
| `/`                                                                      | Landing page                                    |
| `/studio/[templateId]`                                                   | The editor for one template                     |
| `/render/[templateId]`                                                   | The page the export screenshots; needs a token  |
| `POST /api/export`                                                       | The export API above                            |
| `/banner/[templateId].png`, `.jpg`                                       | The image URL above                             |
| `/api/github/user-summary`, `/contributions`, `/repos`, `/organizations` | GitHub data for the studio                      |
| `/api/icons/catalog`, `/api/icons?slugs=`                                | Simple Icons for the tech stack banner          |
| `/opengraph-image`, `/studio/[templateId]/opengraph-image`               | Link-preview images, generated at build time    |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt`                               | Crawl rules, sitemap and a summary for AI tools |
