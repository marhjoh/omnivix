import { useEffect, useId, useRef, useState, type FocusEvent } from "react";
import { ChevronDown, Copy, Download, Loader2 } from "lucide-react";
import { EXPORT_PIXEL_RATIOS, type ExportPixelRatio } from "@/src/export/viewport";
import { EXPORT_FORMAT_DETAILS, EXPORT_FORMATS, type ExportFormat } from "@/src/export/format";
import { HoverHighlightItem } from "@/src/ui/HoverHighlight";
import { highlightItemClass } from "@/src/ui/highlightClasses";
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

/** Copy, then Download joined to its options (resolution and format), for the studio header. */
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
  const choice = `${pixelRatio}× ${formatLabel}`;
  const busy = exporting !== null;
  const isDownloading = exporting === "download";
  const isCopying = exporting === "copy";
  return (
    <>
      {/* Phones: Copy is in the options panel, where there is room. */}
      <HoverHighlightItem id="copy" className="hidden sm:block">
        <button
          type="button"
          onClick={onCopy}
          disabled={busy || exportBlocked}
          aria-label={isCopying ? "Copying…" : "Copy image"}
          aria-busy={isCopying}
          className={`${highlightItemClass} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {isCopying ? (
            <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin" />
          ) : (
            <Copy className="h-[18px] w-[18px] shrink-0" />
          )}
        </button>
      </HoverHighlightItem>
      <div ref={rootRef} onBlur={onBlur} className="relative ml-1">
        <div className={controls.split}>
          {/* The aria-label names the format (scripts/readme-screenshots.mts waits for it). */}
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
            {/* From md: between sm and md the header also shows the @username, so the choice waits. */}
            <span className={`${controls.splitChoice} hidden md:inline-block`} aria-hidden>
              {choice}
            </span>
          </button>
          <button
            type="button"
            ref={toggleRef}
            onClick={() => setOpen((isOpen) => !isOpen)}
            disabled={busy}
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            aria-label={`Export options: ${pixelRatio}×, ${formatLabel}`}
            className={controls.splitToggle}
          >
            <ChevronDown className={controls.splitChevron} aria-hidden />
          </button>
        </div>
        {open && (
          // A disclosure, not a dialog: it doesn't trap focus, and the toggle's aria-expanded and
          // aria-controls say what it opens.
          <div id={panelId} role="group" aria-label="Export options" className={controls.panel}>
            {/* Resolution applies to Copy and Download; format only to Download (Copy is a PNG). */}
            <fieldset>
              <legend className={controls.panelLabel}>Resolution</legend>
              <div className={controls.segmented}>
                {EXPORT_PIXEL_RATIOS.map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    aria-pressed={ratio === pixelRatio}
                    onClick={() => onPixelRatioChange(ratio)}
                    disabled={busy}
                    className={controls.segment}
                  >
                    {ratio}×
                    <span className={controls.segmentHint}>
                      {bannerSize.width * ratio} × {bannerSize.height * ratio}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-4">
              <legend className={controls.panelLabel}>Download format</legend>
              <div className={controls.segmented}>
                {EXPORT_FORMATS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={option === format}
                    onClick={() => onFormatChange(option)}
                    disabled={busy}
                    className={controls.segment}
                  >
                    {EXPORT_FORMAT_DETAILS[option].label}
                    <span className={controls.segmentHint}>
                      {EXPORT_FORMAT_DETAILS[option].hint}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onCopy();
              }}
              disabled={busy || exportBlocked}
              className="btn-secondary mt-4 w-full py-2! sm:hidden"
            >
              <Copy className="h-4 w-4" aria-hidden />
              Copy image
            </button>
          </div>
        )}
      </div>
    </>
  );
}
