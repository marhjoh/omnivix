import { useTransition } from "react";
import { EXPORT_FORMAT_DETAILS, type ExportFormat } from "@/src/export/format";
import { BANNER_SIZES, exportFormatFor, exportFormats, exportPixelRatioFor } from "@/src/lib/sizes";
import type { ExportRequest } from "@/src/export/request";
import { EXPORT_LIMIT_MESSAGE, limitMessage } from "@/src/lib/rateLimitMessage";
import { readApiError } from "@/src/lib/apiError";

export type ExportKind = "download" | "copy";

/** Exports the banner. Thrown errors have a message that can be shown to the user as is. */
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
 * Download and Copy for the studio. Each runs as an async transition, and `exporting` says which
 * one is running. Only one export runs at a time. Errors and copy confirmations show in the toast.
 */
export function useBannerExport({
  request,
  format,
  showError,
  showSuccess,
  dismissToast,
}: {
  /** Everything except the format. Download picks one, and Copy always uses PNG. */
  request: Omit<ExportRequest, "format">;
  format: ExportFormat;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  dismissToast: () => void;
}) {
  const [downloading, startDownload] = useTransition();
  const [copying, startCopy] = useTransition();
  const exporting: ExportKind | null = downloading ? "download" : copying ? "copy" : null;

  /** Uses the chosen pixel ratio, or the largest the banner format allows for `file`. */
  function requestAs(file: ExportFormat): ExportRequest {
    const pixelRatio = exportPixelRatioFor(BANNER_SIZES[request.size], file, request.pixelRatio);
    return { ...request, pixelRatio, format: file };
  }

  // Call dismissToast before the action. Inside it, the toast would only close after the export.
  // Errors are caught because one thrown from an action goes to an error boundary, not the toast.
  function download() {
    if (exporting) return;
    dismissToast();
    // Falls back to the banner format's own file type if it doesn't take the chosen one.
    const file = exportFormatFor(BANNER_SIZES[request.size], format);
    startDownload(async () => {
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
      }
    });
  }

  function copy() {
    if (exporting) return;
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
    // Safari only allows the clipboard write during the click. So we pass the image as a promise
    // that resolves when the export is done. The action runs synchronously up to its first await,
    // which keeps the write inside the click.
    startCopy(async () => {
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
      }
    });
  }

  /** Copies an embed snippet. `name` goes in the confirmation, e.g. "Markdown copied." */
  async function copyEmbed(text: string, name: string) {
    dismissToast();
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(`${name} copied.`);
    } catch {
      showError("Couldn't copy. Select the text and copy it instead.");
    }
  }

  return { exporting, download, copy, copyEmbed };
}
