import { useState } from "react";
import { EXPORT_FORMAT_DETAILS, type ExportFormat } from "@/src/export/format";
import { BANNER_SIZES, exportFormatFor, exportFormats, exportPixelRatioFor } from "@/src/lib/sizes";
import type { ExportRequest } from "@/src/types/template";
import { EXPORT_LIMIT_MESSAGE, limitMessage } from "@/src/lib/rateLimitMessage";
import { readApiError } from "@/src/lib/apiError";

export type ExportKind = "download" | "copy";

/** Exports the banner; a failure throws an Error whose message can be shown as is. */
async function exportBanner(request: ExportRequest): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    const { message, limit } = await readApiError(response);
    if (limit) throw new Error(limitMessage(limit, EXPORT_LIMIT_MESSAGE));
    throw new Error(message ?? "Couldn't export the banner. Try again.");
  }
  return response.blob();
}

/**
 * Download and Copy for the studio. One export runs at a time, so a second click can't start
 * another; problems and the copy confirmation are reported through the studio's toast.
 */
export function useBannerExport({
  request,
  format,
  blocked,
  showError,
  showSuccess,
  dismissToast,
}: {
  /** Everything but the format, which Download chooses and Copy can't (the clipboard takes PNG). */
  request: Omit<ExportRequest, "format">;
  format: ExportFormat;
  /** Nothing to export yet, or a problem with it (see isExportBlocked). */
  blocked: boolean;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  dismissToast: () => void;
}) {
  const [exporting, setExporting] = useState<ExportKind | null>(null);

  /** The request as `file`, at the chosen ratio or the largest the banner format takes as `file`. */
  function requestAs(file: ExportFormat): ExportRequest {
    const pixelRatio = exportPixelRatioFor(BANNER_SIZES[request.size], file, request.pixelRatio);
    return { ...request, pixelRatio, format: file };
  }

  async function download() {
    if (blocked || exporting) return;
    setExporting("download");
    dismissToast();
    // The chosen format, or the banner format's own if it doesn't take that one.
    const file = exportFormatFor(BANNER_SIZES[request.size], format);
    try {
      const blob = await exportBanner(requestAs(file));
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const ratioSlug = BANNER_SIZES[request.size].label.replace(":", "x");
      anchor.download = `omnivix-${request.templateId}-${ratioSlug}.${EXPORT_FORMAT_DETAILS[file].extension}`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      showError((error as Error).message);
    } finally {
      setExporting(null);
    }
  }

  async function copy() {
    if (blocked || exporting) return;
    dismissToast();
    if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
      showError("This browser can't copy images. Download the banner instead.");
      return;
    }
    const bannerFormat = BANNER_SIZES[request.size];
    if (!exportFormats(bannerFormat).includes("png")) {
      const names = bannerFormat.platforms.map((platform) => platform.name).join(", ");
      showError(
        `${names} only takes JPEG, and images are copied as PNG. Download the banner instead.`,
      );
      return;
    }
    setExporting("copy");
    // Safari only allows the write during the click, so the image goes in as a promise that
    // resolves when the export is done.
    const png = exportBanner(requestAs("png"));
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
      showSuccess("Banner copied to the clipboard.");
    } catch {
      const exportError = await png.then(
        () => null,
        (error: Error) => error.message,
      );
      showError(exportError ?? "Couldn't copy the banner. Download it instead.");
    } finally {
      setExporting(null);
    }
  }

  return { exporting, download, copy };
}
