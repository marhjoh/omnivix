import "server-only";
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { parseExportRequest, type ParsedExportRequest } from "@/src/export/payload";
import { renderBanner } from "@/src/export/renderBanner";
import { EXPORT_PIXEL_RATIOS, IMAGE_URL_PIXEL_RATIO } from "@/src/export/format";
import { parseLinkSettings } from "@/src/studio/parseLinkSettings";
import { bannerImageLimit } from "@/src/lib/requestLimits";
import { errorResponse } from "@/src/lib/apiResponse";
import { usernameOf } from "@/src/lib/githubUsername";
import { isOneOf } from "@/src/lib/isOneOf";
import { BANNER_SIZES, exportPixelRatioFor, type BannerSize } from "@/src/lib/sizes";
import { isTemplateId, templateRegistry } from "@/src/templates/registry";
import { THEMES } from "@/src/theme/theme";

/**
 * Cached for a day. After that the CDN serves the old image while it renders a new one in the
 * background. GitHub's image proxy gives up long before a 6–14 s render finishes.
 */
const IMAGE_CACHE = "public, s-maxage=86400, stale-while-revalidate=604800";

/** Keeps a broken embed from rendering again on every page view. */
const ERROR_CACHE = "public, s-maxage=300";

const FILE_PATTERN = /^([a-z-]+)\.(png|jpg)$/;

/**
 * Handles `GET /banner/<templateId>.png` or `.jpg`, the banner as an image for a README or website.
 * It takes the same query as a studio link, plus `pixelRatio` and `uiTheme`. Invalid values fall
 * back to the defaults.
 */
export async function bannerImageRoute(request: NextRequest, file: string): Promise<Response> {
  const response = await bannerImage(request, file);
  if (!response.ok) {
    // Don't cache a 429. Its Retry-After says when the limit resets.
    response.headers.set("Cache-Control", response.status === 429 ? "no-store" : ERROR_CACHE);
  }
  return response;
}

async function bannerImage(request: NextRequest, file: string): Promise<Response> {
  const [, templateId, extension] = FILE_PATTERN.exec(file) ?? [];
  if (!templateId || !isTemplateId(templateId)) {
    return errorResponse("No banner here. Image URLs are /banner/<template>.png or .jpg.", 404);
  }
  // Like in studio links, a repeated key uses its first value.
  const query: Record<string, string> = {};
  for (const [key, value] of request.nextUrl.searchParams) query[key] ??= value;

  const link = parseLinkSettings(templateId, query);
  const size = (link?.settings.size ??
    templateRegistry[templateId].initialState.size) as BannerSize;
  const format = extension === "jpg" ? "jpeg" : "png";
  const asked = EXPORT_PIXEL_RATIOS.find((ratio) => String(ratio) === query.pixelRatio);
  const pixelRatio = Math.min(asked ?? IMAGE_URL_PIXEL_RATIO, IMAGE_URL_PIXEL_RATIO) as 1 | 2;
  const parsed = parseExportRequest({
    templateId,
    size,
    state: { ...link?.settings, ...(link?.username ? { username: link.username } : {}) },
    // Some sizes take a lower ratio, like YouTube at 1×. Download does the same.
    pixelRatio: exportPixelRatioFor(BANNER_SIZES[size], format, pixelRatio),
    format,
    uiTheme: isOneOf(THEMES, query.uiTheme) ? query.uiTheme : undefined,
    // Like other invalid values, it's ignored for a JPEG and with a background image.
    transparent:
      format === "png" && query.transparent === "true" && !link?.settings.backgroundImage
        ? true
        : undefined,
  });
  if (!parsed.ok) {
    return errorResponse("Couldn't make this banner. Check the settings in the URL.", 400, {
      issues: parsed.issues,
    });
  }
  return renderBanner(request, parsed.request, {
    source: "image-url",
    limit: "banner-images",
    limitedUntil: () => bannerImageLimit(limitKey(parsed.request)),
    headers: { "Cache-Control": IMAGE_CACHE },
  });
}

/**
 * All image URLs for one GitHub user share a count, so changing the query doesn't reset it.
 * Banners without a user, like the quote, tech stack and intro banners, each count on their own.
 */
function limitKey(banner: ParsedExportRequest): string {
  const username = usernameOf(banner.state).toLowerCase();
  if (username) return `user:${username}`;
  const { templateId, format, pixelRatio, uiTheme, state } = banner;
  const normalized = JSON.stringify([
    templateId,
    format,
    pixelRatio,
    uiTheme,
    Object.entries(state).sort(),
  ]);
  return `banner:${createHash("sha256").update(normalized).digest("hex")}`;
}
