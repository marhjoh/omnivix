import { useId } from "react";
import { Copy, Download, Link, Loader2 } from "lucide-react";
import { EXPORT_PIXEL_RATIOS, type ExportPixelRatio } from "@/src/export/viewport";
import { EXPORT_FORMAT_DETAILS, EXPORT_FORMATS, type ExportFormat } from "@/src/export/format";
import { exportPixelRatioFor, exportPixelRatios, type BannerFormat } from "@/src/lib/sizes";
import { LabeledGroup } from "@/src/ui/FieldLabel";
import { DropdownChevron } from "@/src/ui/Dropdown";
import { useDisclosure } from "@/src/ui/useDisclosure";
import type { ExportKind } from "@/src/studio/useBannerExport";
import controls from "@/src/studio/controls.module.css";

/** One choice as a row of tiles: the value, and a muted hint below it. */
function ChoiceTiles<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string; hint: string; disabled?: boolean }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <LabeledGroup label={label}>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`${controls.tile} ${controls.panelTile}`}
          >
            <span className="font-semibold">{option.label}</span>
            <span className={controls.tileHint}>{option.hint}</span>
          </button>
        ))}
      </div>
    </LabeledGroup>
  );
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
  bannerFormat,
}: {
  onDownload: () => void;
  onCopy: () => void;
  /** The export that's running, if any; both buttons wait for it. */
  exporting: ExportKind | null;
  /** Nothing to export yet (or a problem with it); Copy and Download are disabled. */
  exportBlocked: boolean;
  /** The saved choice. A banner format that can't take it as `format` uses its largest instead. */
  pixelRatio: ExportPixelRatio;
  onPixelRatioChange: (ratio: ExportPixelRatio) => void;
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  /** The chosen banner format: its size at 1×, for the pixel sizes, and the ratios it takes. */
  bannerFormat: BannerFormat;
}) {
  const { open, setOpen, rootRef, toggleRef, onBlur } = useDisclosure();
  const panelId = useId();
  const formatLabel = EXPORT_FORMAT_DETAILS[format].label;
  const shownPixelRatio = exportPixelRatioFor(bannerFormat, format, pixelRatio);
  const busy = exporting !== null;
  const isDownloading = exporting === "download";
  const isCopying = exporting === "copy";
  return (
    <div ref={rootRef} onBlur={onBlur} className="relative shrink-0">
      <div className={controls.split} data-busy={busy} data-blocked={exportBlocked && !busy}>
        {/* Icon-only on phones. The aria-label names the format (readme-screenshots waits for it). */}
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onDownload();
          }}
          disabled={exportBlocked}
          // aria-disabled, not disabled, while exporting: it keeps focus.
          aria-disabled={busy}
          aria-label={isDownloading ? "Exporting…" : `Download ${formatLabel}`}
          aria-busy={isDownloading}
          className={controls.splitMain}
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {/* Both labels in one cell, so the button keeps one width while exporting. */}
          <span className="hidden justify-items-center sm:grid" aria-hidden>
            <span className={`col-start-1 row-start-1 ${isDownloading ? "invisible" : ""}`}>
              Download
            </span>
            <span className={`col-start-1 row-start-1 ${isDownloading ? "" : "invisible"}`}>
              Exporting…
            </span>
          </span>
        </button>
        <button
          type="button"
          ref={toggleRef}
          onClick={() => {
            if (!busy) setOpen((isOpen) => !isOpen);
          }}
          // aria-disabled, not disabled: it keeps focus while Copy image (in the panel) runs.
          aria-disabled={busy}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={
            isCopying ? "Copying…" : `Export options: ${shownPixelRatio}×, ${formatLabel}`
          }
          aria-busy={isCopying}
          className={controls.splitToggle}
        >
          {/* The panel closes when Copy image starts, so the toggle shows that it's copying. */}
          {isCopying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <DropdownChevron open={open} />
          )}
        </button>
      </div>
      {open && (
        // A disclosure, not a dialog: it doesn't trap focus, and the toggle's aria-expanded and
        // aria-controls say what it opens. Choices keep it open; the actions close it.
        <div
          id={panelId}
          role="group"
          aria-label="Export options"
          className={`popover ${controls.panel}`}
        >
          <div className="space-y-4">
            {/* Resolution applies to Copy and Download; format only to Download (Copy is a PNG). */}
            <ChoiceTiles
              label="Resolution"
              options={EXPORT_PIXEL_RATIOS.map((ratio) => ({
                value: ratio,
                label: `${ratio}×`,
                // Thin spaces keep the largest size on one line in the narrow tile.
                hint: `${bannerFormat.width * ratio}\u2009×\u2009${bannerFormat.height * ratio}`,
                // YouTube's 2× and 3× are JPEG only; Reddit is 1× only.
                disabled: !exportPixelRatios(bannerFormat, format).includes(ratio),
              }))}
              value={shownPixelRatio}
              onChange={onPixelRatioChange}
            />
            <ChoiceTiles
              label="Download format"
              options={EXPORT_FORMATS.map((option) => ({
                value: option,
                label: EXPORT_FORMAT_DETAILS[option].label,
                hint: EXPORT_FORMAT_DETAILS[option].hint,
              }))}
              value={format}
              onChange={onFormatChange}
            />
          </div>
          <div className={controls.panelActions}>
            <button
              type="button"
              onClick={() => {
                // The panel closes, so focus goes back to the toggle instead of the page start.
                toggleRef.current?.focus();
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
