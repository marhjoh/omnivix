import type { ExportRequest } from "@/src/types/template";

/**
 * Path the render page loads an uploaded background from during export. No route serves it:
 * Playwright answers the request from memory (see `captureBannerPng`), so the image never has to
 * fit in the render URL's token.
 */
export const EXPORT_BACKGROUND_PATH = "/__export/background";

/** Decoded size limit; keeps the export request under Vercel's 4.5 MB body limit. */
export const MAX_EXPORT_BACKGROUND_BYTES = 3 * 1024 * 1024;

const DATA_URL_PATTERN = /^data:(image\/(?:png|jpeg|webp|avif));base64,([A-Za-z0-9+/]+={0,2})$/;

export interface ExportBackground {
  contentType: string;
  body: Buffer;
}

export type SplitBackgroundResult =
  | { ok: true; payload: ExportRequest; background?: ExportBackground }
  | { ok: false; error: string };

/**
 * Moves an uploaded (data URL) background out of the payload, leaving `EXPORT_BACKGROUND_PATH` in
 * its place. Other backgrounds (presets, links) are short and stay in the payload.
 */
export function splitUploadedBackground(payload: ExportRequest): SplitBackgroundResult {
  const value = payload.state.backgroundImage;
  if (typeof value !== "string" || !value.startsWith("data:")) return { ok: true, payload };

  const match = DATA_URL_PATTERN.exec(value);
  if (!match) return { ok: false, error: "The uploaded background isn't a supported image." };

  const body = Buffer.from(match[2], "base64");
  if (body.length > MAX_EXPORT_BACKGROUND_BYTES) {
    return { ok: false, error: "The uploaded background is too large. Try a smaller image." };
  }

  return {
    ok: true,
    payload: { ...payload, state: { ...payload.state, backgroundImage: EXPORT_BACKGROUND_PATH } },
    background: { contentType: match[1], body },
  };
}
