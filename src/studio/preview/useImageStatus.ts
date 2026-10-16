import { useEffect, useState } from "react";

type ImageStatus = "none" | "loading" | "loaded" | "failed";

/**
 * Outcome per src for the browser session, so a remount doesn't wait on an image already seen.
 * Uploads (data URLs, often megabytes) aren't kept; they load instantly anyway.
 */
const knownStatus = new Map<string, "loaded" | "failed">();

/**
 * Preloads `src` and reports its status, so the preview can wait for an image (instead of showing
 * the banner with an empty spot that fills in later on slow networks) and skip it if it fails.
 * The browser caches the preloaded image, so the banner's own <img> renders it immediately.
 */
export function useImageStatus(
  src: string | undefined,
  {
    assumeLoaded = false,
  }: {
    /** Report "loaded" while it loads, for an image the page itself is already showing. */
    assumeLoaded?: boolean;
  } = {},
): ImageStatus {
  const [result, setResult] = useState<{ src: string; status: "loaded" | "failed" } | null>(null);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    let cancelled = false;
    const settle = (status: "loaded" | "failed") => {
      if (cancelled) return;
      if (!src.startsWith("data:")) knownStatus.set(src, status);
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
    img.src = src;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  if (!src) return "none";
  return result?.src === src
    ? result.status
    : (knownStatus.get(src) ?? (assumeLoaded ? "loaded" : "loading"));
}
