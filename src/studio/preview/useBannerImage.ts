import { useEffect, useRef } from "react";
import { preload } from "react-dom";
import { PREVIEW_PHOTO_SIZES, previewPhotoSrcSet } from "@/src/backgrounds/presets";
import { isHttpImageUrl, isInsecureImageLink } from "@/src/lib/imageLink";
import { useImageStatus } from "@/src/studio/preview/useImageStatus";

/**
 * An image setting (the background, the logo) as the preview loads it. One that can't be used (it
 * failed to load, or is an http link from an older saved setting) is left out of the preview, so
 * the banner never shows a broken-image icon and the export is blocked; the sidebar keeps the
 * choice. Links report their own problems (ImagePicker); a preset or upload that fails to load is
 * reported here, once per image.
 */
export function useBannerImage(
  value: unknown,
  /** For the message, e.g. "background". */
  name: string,
  showError: (message: string) => void,
) {
  const src = typeof value === "string" && value ? value : undefined;
  // The preview loads a photo preset's smaller copy (see PreviewPhotosContext), so the check below
  // and the preload ask for the same file. The preload starts it from the page's <head>, at high
  // priority, instead of when the banner is drawn. Not for uploads: their data URL is the image.
  const srcSet = src ? previewPhotoSrcSet(src) : undefined;
  const sizes = srcSet ? PREVIEW_PHOTO_SIZES : undefined;
  if (src && !src.startsWith("data:")) {
    preload(src, { as: "image", imageSrcSet: srcSet, imageSizes: sizes, fetchPriority: "high" });
  }
  const status = useImageStatus(src, { srcSet, sizes });
  const failed = status === "failed";

  const reportedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!failed || !src || isHttpImageUrl(src)) return;
    if (reportedRef.current === src) return;
    reportedRef.current = src;
    showError(`Couldn't load this ${name}.`);
  }, [failed, src, name, showError]);

  return { status, unusable: failed || isInsecureImageLink(value) };
}
