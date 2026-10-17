import type { ExportRequest } from "@/src/types/template";
import { BackgroundLinkError, fetchBackgroundLink } from "@/src/export/backgroundLink";
import { MAX_UPLOADED_BACKGROUND_BYTES } from "@/src/lib/backgroundImageUpload";

/**
 * Path the render page loads an uploaded or linked background from during export. No route
 * serves it: Playwright answers the request from memory (see `captureBanner`), so an upload
 * never has to fit in the render URL's token and Playwright never loads a link itself.
 */
export const EXPORT_BACKGROUND_PATH = "/__export/background";

const DATA_URL_PATTERN = /^data:(image\/(?:png|jpeg|webp|avif));base64,([A-Za-z0-9+/]+={0,2})$/;
/** Built-in presets (src/backgrounds/presets.ts). */
const PRESET_PATTERN = /^\/backgrounds\/[a-z0-9-]+\.(?:avif|svg)$/;

export interface ExportBackground {
  contentType: string;
  body: Buffer;
}

type ExportBackgroundResult =
  | { ok: true; payload: ExportRequest; background?: ExportBackground }
  | { ok: false; error: string };

function served(payload: ExportRequest, background: ExportBackground): ExportBackgroundResult {
  return {
    ok: true,
    payload: { ...payload, state: { ...payload.state, backgroundImage: EXPORT_BACKGROUND_PATH } },
    background,
  };
}

function decodeUpload(value: string): ExportBackground | string {
  const match = DATA_URL_PATTERN.exec(value);
  if (!match) return "The uploaded background isn't a supported image.";
  const body = Buffer.from(match[2], "base64");
  if (body.length > MAX_UPLOADED_BACKGROUND_BYTES) {
    return "The uploaded background is too large. Try a smaller image.";
  }
  return { contentType: match[1], body };
}

/**
 * Prepares the payload's background for export. Uploads (data URLs) and links are taken out of
 * the payload and returned as bytes, leaving `EXPORT_BACKGROUND_PATH` in their place; links are
 * downloaded here under `fetchBackgroundLink`'s rules. Presets stay as they are. Anything else is
 * rejected.
 */
export async function resolveExportBackground(
  payload: ExportRequest,
): Promise<ExportBackgroundResult> {
  const value = payload.state.backgroundImage;
  if (value === undefined || value === "") return { ok: true, payload };
  if (typeof value !== "string") return { ok: false, error: "Unsupported background image." };
  if (PRESET_PATTERN.test(value)) return { ok: true, payload };

  if (value.startsWith("data:")) {
    const upload = decodeUpload(value);
    return typeof upload === "string" ? { ok: false, error: upload } : served(payload, upload);
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      return served(payload, await fetchBackgroundLink(value));
    } catch (error) {
      if (error instanceof BackgroundLinkError) return { ok: false, error: error.message };
      throw error;
    }
  }

  return { ok: false, error: "Unsupported background image." };
}
