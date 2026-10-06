import { useEffect, useState } from "react";

export type ImageStatus = "none" | "loading" | "loaded" | "failed";

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
    img.onload = () => setResult({ src, status: "loaded" });
    img.onerror = () => setResult({ src, status: "failed" });
    img.src = src;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  if (!src) return "none";
  return result?.src === src ? result.status : "loading";
}
