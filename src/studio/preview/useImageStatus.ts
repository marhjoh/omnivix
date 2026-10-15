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
export function useImageStatus(src: string | undefined): ImageStatus {
  const [result, setResult] = useState<{ src: string; status: "loaded" | "failed" } | null>(null);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    const settle = (status: "loaded" | "failed") => {
      if (!src.startsWith("data:")) knownStatus.set(src, status);
      setResult({ src, status });
    };
    img.onload = () => settle("loaded");
    img.onerror = () => settle("failed");
    img.src = src;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  if (!src) return "none";
  return result?.src === src ? result.status : (knownStatus.get(src) ?? "loading");
}
