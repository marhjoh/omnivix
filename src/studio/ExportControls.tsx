import { useId } from "react";
import { Copy, Download, Link } from "lucide-react";
import {
  EXPORT_PIXEL_RATIOS,
  type ExportPixelRatio,
  EXPORT_FORMAT_DETAILS,
  EXPORT_FORMATS,
  type ExportFormat,
} from "@/src/export/format";
import {
  exportFormatFor,
  exportFormats,
  exportPixelRatioFor,
  exportPixelRatios,
  type BannerFormat,
} from "@/src/lib/sizes";
import { DropdownChevron } from "@/src/ui/Dropdown";
import { Spinner } from "@/src/ui/Spinner";
import { useDisclosure } from "@/src/ui/useDisclosure";
import { TileGroup } from "@/src/studio/TileGroup";
import type { ExportKind } from "@/src/studio/useBannerExport";
import controls from "@/src/studio/controls.module.css";

/** A tile's value, and a muted hint below it. */
function ChoiceTile({ label, hint }: { label: string; hint: string }) {
  return (
    <>
      <span className="font-semibold">{label}</span>
      <span className={controls.tileHint}>{hint}</span>
    </>
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
  /** The saved choice. A banner format that doesn't take it uses its own instead. */
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  /** The chosen banner format: its size at 1×, for the pixel sizes, and what it takes. */
  bannerFormat: BannerFormat;
}) {
  const { open, setOpen, close, rootRef, toggleRef, onBlur } = useDisclosure();
  const panelId = useId();
  const shownFormat = exportFormatFor(bannerFormat, format);
  const formatLabel = EXPORT_FORMAT_DETAILS[shownFormat].label;
  const shownPixelRatio = exportPixelRatioFor(bannerFormat, shownFormat, pixelRatio);
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
          {isDownloading ? <Spinner /> : <Download className="h-4 w-4" />}
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
          <DropdownChevron open={open} busy={isCopying} />
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
            <TileGroup
              label="Resolution"
              columns={EXPORT_PIXEL_RATIOS.length}
              tileClassName={controls.panelTile}
              options={EXPORT_PIXEL_RATIOS.map((ratio) => ({
                value: ratio,
                label: `${ratio}×`,
                // Thin spaces keep the largest size on one line in the narrow tile.
                hint: `${bannerFormat.width * ratio}\u2009×\u2009${bannerFormat.height * ratio}`,
                // YouTube and Reddit are 1× only.
                disabled: !exportPixelRatios(bannerFormat, shownFormat).includes(ratio),
              }))}
              value={shownPixelRatio}
              onChange={onPixelRatioChange}
            >
              {(option) => <ChoiceTile {...option} />}
            </TileGroup>
            <TileGroup
              label="Download format"
              columns={EXPORT_FORMATS.length}
              tileClassName={controls.panelTile}
              options={EXPORT_FORMATS.map((option) => ({
                value: option,
                label: EXPORT_FORMAT_DETAILS[option].label,
                hint: EXPORT_FORMAT_DETAILS[option].hint,
                // Reddit is JPEG only.
                disabled: !exportFormats(bannerFormat).includes(option),
              }))}
              value={shownFormat}
              onChange={onFormatChange}
            >
              {(option) => <ChoiceTile {...option} />}
            </TileGroup>
          </div>
          <div className={controls.panelActions}>
            <button
              type="button"
              onClick={() => {
                close();
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
