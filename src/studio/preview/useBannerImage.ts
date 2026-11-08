import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { previewPhotoSrcSet } from "@/src/backgrounds/presets";
import { PREVIEW_PHOTO_SIZES } from "@/src/studio/layout";
import { isDataUrl, isHttpsUrl } from "@/src/lib/imageSource";
import { useImageStatus } from "@/src/studio/useImageStatus";

/**
 * Loads an image setting (background, logo or photo) for the preview. An image that fails is left
 * out of the preview and blocks the export, but stays in the sidebar. Failures are reported here once, for
 * presets, uploads and links the studio opened with. Links typed later are reported by the link
 * field (useImageLinkField).
 */
export function useBannerImage(
  value: unknown,
  /** For the message, e.g. "background". */
  name: string,
  showError: (message: string) => void,
) {
  const src = typeof value === "string" && value ? value : undefined;
  // The preview loads a smaller copy of photo presets (see PreviewPhotosContext), so the status
  // check and the preload ask for that same file. The preload starts the download from the page's
  // <head> at high priority, before the banner is drawn. Uploads skip it because their data URL is
  // already the image.
  const srcSet = src ? previewPhotoSrcSet(src) : undefined;
  const sizes = srcSet ? PREVIEW_PHOTO_SIZES : undefined;
  if (src && !isDataUrl(src)) {
    preload(src, { as: "image", imageSrcSet: srcSet, imageSizes: sizes, fetchPriority: "high" });
  }
  const status = useImageStatus(src, { srcSet, sizes });
  const failed = status === "failed";

  const [openedWith] = useState(src);
  const reportedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!failed || !src || (isHttpsUrl(src) && src !== openedWith)) return;
    if (reportedRef.current === src) return;
    reportedRef.current = src;
    showError(`Couldn't load this ${name}.`);
  }, [failed, src, openedWith, name, showError]);

  /** The image, unless it failed to load. */
  const usableSrc = failed ? undefined : src;
  return { status, usableSrc };
}
