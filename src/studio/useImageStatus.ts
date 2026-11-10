import { useEffect, useState } from "react";
import { isDataUrl } from "@/src/lib/imageSource";

type ImageStatus = "none" | "loading" | "loaded" | "failed";

/**
 * Images loaded in this session, so a remount doesn't wait for one again. Failures aren't kept, so
 * a link that failed on a bad connection gets retried. Uploads aren't kept either. They're data
 * URLs, often megabytes, and load instantly anyway.
 */
const loadedSrcs = new Set<string>();

/**
 * Preloads `src` and reports its status. The preview uses it to wait for an image instead of
 * showing an empty spot on slow networks, and to skip images that fail. The browser caches the
 * preloaded file, so the banner's own <img> shows it right away.
 */
export function useImageStatus(
  src: string | undefined,
  {
    assumeLoaded = false,
    srcSet,
    sizes,
  }: {
    /** Reports "loaded" right away, for an image the page is already showing. */
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
    let canceled = false;
    const settle = (status: "loaded" | "failed") => {
      if (canceled) return;
      if (status === "loaded" && !isDataUrl(src)) loadedSrcs.add(src);
      setResult({ src, status });
    };
    // Decode first so the banner can draw the image in the same frame it switches to it.
    img.onload = () => {
      img.decode().then(
        () => settle("loaded"),
        () => settle("loaded"),
      );
    };
    img.onerror = () => settle("failed");
    // Set sizes before srcset so the browser's first pick already uses it.
    if (sizes) img.sizes = sizes;
    if (srcSet) img.srcset = srcSet;
    img.src = src;
    return () => {
      canceled = true;
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
