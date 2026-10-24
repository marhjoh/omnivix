import { useEffect, useId, useRef, useState, type FocusEvent } from "react";
import { ChevronDown, Copy, Download, Link, Loader2 } from "lucide-react";
import { EXPORT_PIXEL_RATIOS, type ExportPixelRatio } from "@/src/export/viewport";
import { EXPORT_FORMAT_DETAILS, EXPORT_FORMATS, type ExportFormat } from "@/src/export/format";
import { LabeledGroup } from "@/src/ui/FieldLabel";
import type { ExportKind } from "@/src/studio/useBannerExport";
import controls from "@/src/studio/controls.module.css";

/**
 * Open/close for a disclosure panel: it closes on Escape (focus goes back to the toggle), on a
 * click outside the root, and when focus moves out of it (Tab past the last option).
 */
function useDisclosure() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);
  // No relatedTarget (a click on nothing focusable) is left to the pointerdown handler.
  const onBlur = (e: FocusEvent) => {
    const next = e.relatedTarget;
    if (next && !rootRef.current?.contains(next)) setOpen(false);
  };
  return { open, setOpen, rootRef, toggleRef, onBlur };
}

/**
 * Download joined to its options panel, for the studio header's right group. The panel holds
 * everything that takes the banner out of the studio: resolution and format, then the copy actions
 * (Copy image, Copy link, and later the embed URL, #83), so the header stays one button wide.
 */
export function ExportControls({
  onDownload,
  onCopy,
  exporting,
  exportBlocked,
  pixelRatio,
  onPixelRatioChange,
  format,
  onFormatChange,
  bannerSize,
}: {
  onDownload: () => void;
  onCopy: () => void;
  /** The export that's running, if any; both buttons wait for it. */
  exporting: ExportKind | null;
  /** Nothing to export yet (or a problem with it); Copy and Download are disabled. */
  exportBlocked: boolean;
  pixelRatio: ExportPixelRatio;
  onPixelRatioChange: (ratio: ExportPixelRatio) => void;
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  /** The chosen format's size at 1×, for the pixel sizes in the options. */
  bannerSize: { width: number; height: number };
}) {
  const { open, setOpen, rootRef, toggleRef, onBlur } = useDisclosure();
  const panelId = useId();
  const formatLabel = EXPORT_FORMAT_DETAILS[format].label;
  const busy = exporting !== null;
  const isDownloading = exporting === "download";
  const isCopying = exporting === "copy";
  return (
    <div ref={rootRef} onBlur={onBlur} className="relative">
      <div className={controls.split}>
        {/*
            Icon-only on phones. The aria-label names the format, which the visible label leaves to
            the options (scripts/readme-screenshots.mts waits for it).
          */}
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onDownload();
          }}
          disabled={busy || exportBlocked}
          aria-label={isDownloading ? "Exporting…" : `Download ${formatLabel}`}
          aria-busy={isDownloading}
          className={controls.splitMain}
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{isDownloading ? "Exporting…" : "Download"}</span>
        </button>
        <button
          type="button"
          ref={toggleRef}
          onClick={() => setOpen((isOpen) => !isOpen)}
          disabled={busy}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={isCopying ? "Copying…" : `Export options: ${pixelRatio}×, ${formatLabel}`}
          aria-busy={isCopying}
          className={controls.splitToggle}
        >
          {/* The panel closes when Copy image starts, so the toggle shows that it's copying. */}
          {isCopying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className={controls.splitChevron} aria-hidden />
          )}
        </button>
      </div>
      {open && (
        // A disclosure, not a dialog: it doesn't trap focus, and the toggle's aria-expanded and
        // aria-controls say what it opens. Choices keep it open; the actions close it.
        <div id={panelId} role="group" aria-label="Export options" className={controls.panel}>
          <div className="space-y-4">
            {/* Resolution applies to Copy and Download; format only to Download (Copy is a PNG). */}
            <LabeledGroup label="Resolution">
              <div className="grid grid-cols-3 gap-2">
                {EXPORT_PIXEL_RATIOS.map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    aria-pressed={ratio === pixelRatio}
                    onClick={() => onPixelRatioChange(ratio)}
                    className={`${controls.tile} ${controls.panelTile}`}
                  >
                    <span className="font-semibold">{ratio}×</span>
                    {/* Thin spaces keep the largest size on one line in the narrow tile. */}
                    <span className={controls.tileHint}>
                      {bannerSize.width * ratio}
                      {"\u2009×\u2009"}
                      {bannerSize.height * ratio}
                    </span>
                  </button>
                ))}
              </div>
            </LabeledGroup>
            <LabeledGroup label="Download format">
              <div className="grid grid-cols-2 gap-2">
                {EXPORT_FORMATS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={option === format}
                    onClick={() => onFormatChange(option)}
                    className={`${controls.tile} ${controls.panelTile}`}
                  >
                    <span className="font-semibold">{EXPORT_FORMAT_DETAILS[option].label}</span>
                    <span className={controls.tileHint}>{EXPORT_FORMAT_DETAILS[option].hint}</span>
                  </button>
                ))}
              </div>
            </LabeledGroup>
          </div>
          <div className={controls.panelActions}>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onCopy();
              }}
              disabled={exportBlocked}
              className={controls.panelAction}
            >
              <Copy className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              Copy image
            </button>
            {/* Placeholder: a studio link with these settings (#132's link format). */}
            <button type="button" disabled className={controls.panelAction}>
              <Link className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              Copy link
              <span className={controls.soon}>Coming soon</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
