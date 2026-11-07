// Builds the export API, studio link and image URL sections of /llms.txt from the templates, sizes
// and formats. This keeps the docs in step with what the API and the studio accept.
import { BACKGROUND_PRESETS } from "@/src/backgrounds/presets";
import {
  DEFAULT_EXPORT_FORMAT,
  EXPORT_FORMATS,
  DEFAULT_PIXEL_RATIO,
  EXPORT_PIXEL_RATIOS,
} from "@/src/export/format";
import { MAX_REPOS } from "@/src/lib/repoSelection";
import {
  BANNER_SIZES,
  BANNER_SIZE_KEYS,
  exportFormats,
  exportPixelRatios,
  platformNames,
} from "@/src/lib/sizes";
import { getTemplates } from "@/src/templates/registry";
import { DEFAULT_THEME, THEMES } from "@/src/theme/theme";
import type { EditorFieldSchema, TemplateId } from "@/src/templates/types";
import { listText } from "@/src/lib/text";
import type { TimedLimit } from "@/src/lib/apiError";
import { LIMIT_TITLES } from "@/src/lib/rateLimitMessage";
import { studioPath } from "@/src/lib/site";
import { currentYear, LATEST_YEAR } from "@/src/lib/contributionYear";
import { linkFormatsOf } from "@/src/export/images";
import { GRID_COLOR_IDS } from "@/src/banner/gridColors";
import {
  DEFAULT_BACKGROUND_OPACITY,
  MAX_BACKGROUND_ZOOM,
  MIN_BACKGROUND_ZOOM,
} from "@/src/banner/background";

/** The example request in the docs. A test checks that the API accepts it. */
export const EXAMPLE_REQUEST = {
  templateId: "github-banner",
  size: "wide",
  state: { username: "marhjoh" },
};

/**
 * The example studio link in the docs, also shown as an image URL. A test checks that the studio
 * reads all of it.
 */
export const EXAMPLE_LINK: { templateId: TemplateId; query: Record<string, string> } = {
  templateId: "contribution-banner",
  query: { username: "marhjoh", size: "header", themeId: "sunset" },
};

const code = (value: unknown) => `\`${typeof value === "string" ? value : JSON.stringify(value)}\``;

/** "`a`, `b` or `c`" */
function oneOf(values: readonly unknown[]): string {
  return listText(values.map(code));
}

/** What a setting accepts, in words. */
function accepts(field: EditorFieldSchema): string {
  if (field.key === "themeId") {
    return `the contribution grid's colors, ${oneOf(GRID_COLOR_IDS)}`;
  }
  if (field.key === "year") {
    return `${code(LATEST_YEAR)} (the last 365 days) or a year, e.g. ${code(String(currentYear()))}`;
  }
  switch (field.type) {
    case "select":
      return oneOf(field.options?.map((option) => option.value) ?? []);
    case "toggle":
      return "`true` or `false`";
    case "text":
    case "textarea":
      return `text, at most ${field.maxLength} characters${field.required ? ", not empty" : ""}`;
    case "range":
      return `a number from ${field.min} to ${field.max}`;
    case "backgroundPicker":
      return `the path of a built-in background (see below), e.g. \`/backgrounds/seoul.avif\`, or a public \`https://\` ${linkFormatsOf("backgroundImage")} image URL; leave out for none`;
    case "colorPicker":
      return `${oneOf(field.options?.map((option) => option.value) ?? [])}, or a hex color such as \`#ff6600\` (\`%23ff6600\` in a studio link)`;
    case "logoPicker":
      return `a public \`https://\` ${linkFormatsOf("logoImage")} image URL; leave out for none`;
    case "repoMultiSelect":
      return `repository names, comma-separated, at most ${MAX_REPOS} (used when \`mode\` is \`selected\`)`;
    default:
      return "";
  }
}

/** A timed 429's body as the API sends it (src/lib/apiResponse.ts). */
function limitBody(limit: TimedLimit): string {
  return `\`{ "error": ${JSON.stringify(`${LIMIT_TITLES[limit]}.`)}, "limit": "${limit}", "resetAt": "<ISO time>" }\``;
}

/** The year default is set at build time, so the docs say "this year" instead of a number. */
function defaultOf(key: string, value: unknown): string {
  if (key === "year") return "this year";
  return value === undefined || value === "" ? "none" : code(value);
}

export function exportApiDocs(siteUrl: URL): string[] {
  const endpoint = new URL("/api/export", siteUrl).toString();
  const exampleQuery = new URLSearchParams(EXAMPLE_LINK.query);
  const imageUrl = new URL(`/banner/${EXAMPLE_LINK.templateId}.png?${exampleQuery}`, siteUrl);
  const sizes = BANNER_SIZE_KEYS.map((key) => {
    const format = BANNER_SIZES[key];
    return `${code(key)} (${format.label}, ${format.width} × ${format.height}: ${platformNames(format)})`;
  });
  // " (`youtube` as `png`: `1` only)", for the sizes that can't take every ratio.
  const limits = BANNER_SIZE_KEYS.flatMap((key) =>
    exportFormats(BANNER_SIZES[key])
      .filter((file) => BANNER_SIZES[key].maxPixelRatio?.[file])
      .map(
        (file) =>
          `${code(key)} as ${code(file)}: ${oneOf(exportPixelRatios(BANNER_SIZES[key], file))} only`,
      ),
  );
  const ratioLimits = limits.length ? ` (${limits.join("; ")})` : "";
  // " (`reddit`: `jpeg` only, under 500 KB)", for the sizes that don't take every format.
  const formatLimits = BANNER_SIZE_KEYS.filter((key) => BANNER_SIZES[key].formats).map((key) => {
    const { uploadLimit } = BANNER_SIZES[key];
    const under = uploadLimit ? `, under ${uploadLimit / 1000} KB` : "";
    return `${code(key)}: ${oneOf(exportFormats(BANNER_SIZES[key]))} only${under}`;
  });
  const formatNotes = formatLimits.length ? ` (${formatLimits.join("; ")})` : "";
  return [
    "## Export API",
    "",
    `\`POST ${endpoint}\` with a JSON body returns the banner as an image. No key or sign-in is needed.`,
    "",
    "| Field | Value |",
    "| --- | --- |",
    `| \`templateId\` | ${oneOf(getTemplates().map(({ meta }) => meta.id))} |`,
    `| \`size\` | ${sizes.join(", ")} |`,
    "| `state` | The template's settings (below). Any you leave out use the default; unknown ones are ignored. |",
    `| \`pixelRatio\` | ${oneOf(EXPORT_PIXEL_RATIOS)}, default ${code(DEFAULT_PIXEL_RATIO)}${ratioLimits}: the image is the size above times this |`,
    `| \`format\` | ${oneOf(EXPORT_FORMATS)}, default ${code(DEFAULT_EXPORT_FORMAT)}${formatNotes} |`,
    `| \`uiTheme\` | ${oneOf(THEMES)}, default ${code(DEFAULT_THEME)}: whether the banner's cards and text are light or dark |`,
    "| `transparent` | `true` or `false`, default `false`: leaves out the theme's background color. `png` only, and not with a `backgroundImage`. |",
    "",
    "Example:",
    "",
    "```sh",
    `curl -X POST ${endpoint} \\`,
    '  -H "Content-Type: application/json" \\',
    `  -d '${JSON.stringify(EXAMPLE_REQUEST)}' \\`,
    "  -o banner.png",
    "```",
    "",
    "Responses:",
    "",
    "- `200`: the image (`image/png` or `image/jpeg`).",
    '- `400`: `{ "error": "…", "issues": [{ "path": "state.username", "message": "Required" }] }`, one issue per field that failed. An image that can\'t be used is a `400` with only an `error`.',
    '- `404`: the GitHub user doesn\'t exist, with `issues: [{ "path": "state.username", … }]`.',
    "- `413`: the settings are too long to export, such as a very long quote.",
    `- \`429\`: a rate limit. GitHub's, on banners with GitHub data: ${limitBody("github")}. The daily export quota per IP address: ${limitBody("daily-exports")}. Or the burst limit, 30 per 10 minutes per IP address, with no \`resetAt\`.`,
    "- `500`: the export failed; trying again may work.",
    "",
    "## Studio links",
    "",
    "To give a user a banner they can still adjust, link to the studio with the same settings as query parameters:",
    "",
    `${new URL(`${studioPath(EXAMPLE_LINK.templateId)}?${exampleQuery}`, siteUrl)}`,
    "",
    "`size` and the settings below work as in the export API; toggles are `true` or `false`. `backgroundImage` can be a built-in background or an `https://` link, and `logoImage` an `https://` link; uploaded images can't be linked. Positions are `x,y`, e.g. `contentPosition=100,0`. The studio leaves out values that aren't valid and keeps the rest.",
    "",
    "## Image URLs",
    "",
    "To embed a banner in a README or website, use its image URL: `/banner/<templateId>.png` (or `.jpg`) with a studio link's query. It stays up to date as the GitHub data changes. To get a studio link's image URL, change its path:",
    "",
    `${imageUrl}`,
    "",
    `It also takes \`pixelRatio\` (\`1\` or \`2\`, default \`2\`), \`uiTheme\` and, for \`.png\` without a background image, \`transparent=true\`. Invalid values use the defaults. In Markdown: \`![My banner](${imageUrl})\`.`,
    "",
    `Images are cached for a day. Each GitHub username, or each banner without one, gets 30 renders a day. Over that, the answer is ${limitBody("banner-images")}. Errors are JSON, as in the export API.`,
    "",
    "## Template settings",
    "",
    "For the export API's `state`, studio links and image URLs.",
    "",
    'Every template also takes `contentPosition`, `logoPosition` and `backgroundPosition`, which the studio sets when the preview is dragged: `{ "x": 0–100, "y": 0–100 }`, where 0 is the left or top and 100 the right or bottom. `contentPosition` and `logoPosition` place the content and the logo in the room left around them inside the banner\'s padding. By default the content follows `alignment` and is centered vertically, and the logo is at the top right. `backgroundPosition` places the background image; by default it\'s centered, or at a built-in background\'s focus.',
    "",
    `\`backgroundZoom\`, from ${code(MIN_BACKGROUND_ZOOM)} to ${code(MAX_BACKGROUND_ZOOM)}, zooms the background in; the default is ${code(MIN_BACKGROUND_ZOOM)}. \`backgroundOpacity\`, from ${code(0)} to ${code(100)} percent, sets how strongly it shows; the default is ${code(DEFAULT_BACKGROUND_OPACITY)}.`,
    "",
    ...getTemplates().flatMap(({ meta, schema, initialState }) => {
      const defaults: Readonly<Record<string, unknown>> = initialState;
      const rows = schema
        .filter((field) => field.type !== "sizeSelect")
        .map(
          (field) =>
            `| \`${field.key}\` | ${field.label}: ${accepts(field)} | ${defaultOf(field.key, defaults[field.key])} |`,
        );
      if (meta.needsUsername) rows.unshift("| `username` | GitHub username, required | |");
      return [
        `### ${meta.title} (\`${meta.id}\`)`,
        "",
        `${meta.description} Default size: ${code(defaults.size)}.`,
        "",
        "| Setting | Accepts | Default |",
        "| --- | --- | --- |",
        ...rows,
        "",
      ];
    }),
    "### Built-in backgrounds",
    "",
    "For `backgroundImage`:",
    "",
    ...BACKGROUND_PRESETS.map(
      (preset) => `- ${code(preset.src)}: ${preset.label} (${preset.group})`,
    ),
    "",
  ];
}
