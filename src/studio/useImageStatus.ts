import { useEffect, useState } from "react";
import { isDataUrl } from "@/src/lib/imageSource";

type ImageStatus = "none" | "loading" | "loaded" | "failed";

/**
 * Images loaded this browser session, so a remount doesn't wait on one already seen. Failures
 * aren't kept: a link that failed on a bad connection is tried again. Uploads (data URLs, often
 * megabytes) aren't kept either; they load instantly anyway.
 */
const loadedSrcs = new Set<string>();

/**
 * Preloads `src` and reports its status, so the preview can wait for an image (instead of showing
 * the banner with an empty spot that fills in later on slow networks) and skip it if it fails.
 * The browser caches the preloaded image, so the banner's own <img> renders it immediately.
 * Not a transition: an image load is a browser event, not an action.
 */
export function useImageStatus(
  src: string | undefined,
  {
    assumeLoaded = false,
    srcSet,
    sizes,
  }: {
    /** Report "loaded" while it loads, for an image the page itself is already showing. */
    assumeLoaded?: boolean;
    /** The `srcset` and `sizes` the page's <img> uses, so the same file is preloaded. */
    srcSet?: string;
    sizes?: string;
  } = {},
): ImageStatus {
  const [result, setResult] = useState<{ src: string; status: "loaded" | "failed" } | null>(null);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    let cancelled = false;
    const settle = (status: "loaded" | "failed") => {
      if (cancelled) return;
      if (status === "loaded" && !isDataUrl(src)) loadedSrcs.add(src);
      setResult({ src, status });
    };
    // Decoded before it counts as loaded, so the banner can draw it in the same frame it switches.
    img.onload = () => {
      img.decode().then(
        () => settle("loaded"),
        () => settle("loaded"),
      );
    };
    img.onerror = () => settle("failed");
    // sizes before srcset, so the first pick already uses it.
    if (sizes) img.sizes = sizes;
    if (srcSet) img.srcset = srcSet;
    img.src = src;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [src, srcSet, sizes]);

  if (!src) return "none";
  return result?.src === src
    ? result.status
    : loadedSrcs.has(src) || assumeLoaded
      ? "loaded"
      : "loading";
}
