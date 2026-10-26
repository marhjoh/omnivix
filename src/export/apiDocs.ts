// The export API and studio link sections of /llms.txt, generated from the templates, sizes and
// formats, so they stay in step with what the API and the studio accept.
import { BACKGROUND_PRESETS } from "@/src/backgrounds/presets";
import { EXPORT_FORMAT, EXPORT_FORMATS } from "@/src/export/format";
import { EXPORT_PIXEL_RATIO, EXPORT_PIXEL_RATIOS } from "@/src/export/viewport";
import { MAX_REPOS } from "@/src/lib/repoSelection";
import { BANNER_SIZES, BANNER_SIZE_KEYS } from "@/src/lib/sizes";
import { getTemplates } from "@/src/templates/registry";
import { DEFAULT_THEME, THEMES } from "@/src/theme/theme";
import type { EditorFieldSchema, TemplateId } from "@/src/types/template";
import { THEME_PRESETS } from "@/src/types/theme";

/** The example request in the docs; a test checks that the API accepts it. */
export const EXAMPLE_REQUEST = {
  templateId: "github-banner",
  size: "wide",
  state: { username: "octocat" },
};

/** The example studio link in the docs; a test checks that the studio reads all of it. */
export const EXAMPLE_LINK: { templateId: TemplateId; query: Record<string, string> } = {
  templateId: "contribution-banner",
  query: { username: "octocat", size: "header", themeId: "sunset" },
};

const code = (value: unknown) => `\`${typeof value === "string" ? value : JSON.stringify(value)}\``;

/** "`a`, `b` or `c`" */
function oneOf(values: readonly unknown[]): string {
  const items = values.map(code);
  return items.length > 1 ? `${items.slice(0, -1).join(", ")} or ${items.at(-1)}` : items[0];
}

/** What a setting accepts, in words. */
function accepts(field: EditorFieldSchema): string {
  if (field.key === "themeId") {
    return `the contribution grid's colors, ${oneOf(THEME_PRESETS.map((preset) => preset.id))}`;
  }
  if (field.key === "year") {
    return `${code("latest")} (the last 365 days) or a year, e.g. ${code(String(new Date().getFullYear()))}`;
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
      return "the path of a built-in background (see below), e.g. `/backgrounds/seoul.avif`, or a public `https://` image URL; leave out for none";
    case "logoPicker":
      return "a public `https://` PNG, JPEG, WebP, AVIF or SVG image URL; leave out for none";
    case "repoMultiSelect":
      return `repository names, comma-separated, at most ${MAX_REPOS} (used when \`mode\` is \`selected\`)`;
    default:
      return "";
  }
}

/** The default as written; the year default is set at build time, so it says "this year". */
function defaultOf(key: string, value: unknown): string {
  if (key === "year") return "this year";
  return value === undefined || value === "" ? "none" : code(value);
}

export function exportApiDocs(siteUrl: URL): string[] {
  const endpoint = new URL("/api/export", siteUrl).toString();
  const sizes = BANNER_SIZE_KEYS.map((key) => {
    const { label, width, height, platforms } = BANNER_SIZES[key];
    return `${code(key)} (${label}, ${width} × ${height}: ${platforms.map((p) => p.name).join(", ")})`;
  });
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
    `| \`pixelRatio\` | ${oneOf(EXPORT_PIXEL_RATIOS)}, default ${code(EXPORT_PIXEL_RATIO)}: the image is the size above times this |`,
    `| \`format\` | ${oneOf(EXPORT_FORMATS)}, default ${code(EXPORT_FORMAT)} |`,
    `| \`uiTheme\` | ${oneOf(THEMES)}, default ${code(DEFAULT_THEME)}: whether the banner's cards and text are light or dark |`,
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
    '- `400`: `{ "error": "…", "issues": [{ "path": "state.username", "message": "Required" }] }`, one issue per field that failed.',
    '- `404`: the GitHub user doesn\'t exist, with `issues: [{ "path": "state.username", … }]`.',
    '- `429`: a rate limit. GitHub\'s, on banners with GitHub data: `{ "error": "GitHub\'s limit is reached.", "resetAt": "<ISO time>" }`. Or the export limit, 30 per 10 minutes per IP address, with no `resetAt`.',
    "- `500`: the export failed; trying again may work.",
    "",
    "## Studio links",
    "",
    "To give a user a banner they can still adjust, link to the studio with the same settings as query parameters:",
    "",
    `${new URL(`/studio/${EXAMPLE_LINK.templateId}?${new URLSearchParams(EXAMPLE_LINK.query)}`, siteUrl)}`,
    "",
    "`size` and the settings below work as in the export API; toggles are `true` or `false`. `backgroundImage` can be a built-in background or an `https://` link, and `logoImage` an `https://` link; uploaded images can't be linked. Positions are `x,y`, e.g. `contentPosition=100,0`. The studio leaves out values that aren't valid and keeps the rest.",
    "",
    "## Template settings",
    "",
    "For the export API's `state`, and studio links.",
    "",
    'Every template also takes `contentPosition`, `logoPosition` and `backgroundPosition`, which the studio sets when the preview is dragged: `{ "x": 0–100, "y": 0–100 }`, where 0 is the left or top and 100 the right or bottom. `contentPosition` and `logoPosition` place the content and the logo in the room left around them inside the banner\'s padding. By default the content follows `alignment` and is centered vertically, and the logo is at the top right. `backgroundPosition` places the background image; by default it\'s centered, or at a built-in background\'s focus.',
    "",
    ...getTemplates().flatMap(({ meta, schema, initialState }) => {
      const defaults = initialState as Record<string, unknown>;
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
        `${meta.description} Default size: ${code(meta.defaultSize)}.`,
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
