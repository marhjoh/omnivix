import { useId } from "react";
import { Copy, Download } from "lucide-react";
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
import { EmbedLinks } from "@/src/studio/EmbedLinks";
import type { ExportKind } from "@/src/studio/useBannerExport";
import type { TemplateId } from "@/src/templates/types";
import type { Theme } from "@/src/theme/theme";
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
 * The Download button with its options panel, for the right side of the studio header. The panel
 * holds resolution, format and the Copy group, so the header only needs one button.
 */
export function ExportControls({
  onDownload,
  onCopy,
  onCopyEmbed,
  banner,
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
  onCopyEmbed: (text: string, name: string) => void;
  /** The banner the embed URL points to. */
  banner: { templateId: TemplateId; state: Record<string, unknown>; uiTheme: Theme };
  /** The export that's running. Both buttons wait until it's done. */
  exporting: ExportKind | null;
  /** Nothing to export yet, or the banner has a problem. Disables Copy and Download. */
  exportBlocked: boolean;
  /** The saved choice. If the banner format doesn't allow it, its largest ratio is used. */
  pixelRatio: ExportPixelRatio;
  onPixelRatioChange: (ratio: ExportPixelRatio) => void;
  /** The saved choice. If the banner format doesn't allow it, the format's own is used. */
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  /** Gives the 1× size for the pixel hints, and which ratios and formats are allowed. */
  bannerFormat: BannerFormat;
}) {
  const { open, setOpen, close, rootRef, toggleRef, onBlur } = useDisclosure();
  const panelId = useId();
  const copyTitleId = useId();
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
          // aria-disabled instead of disabled while exporting, so the button keeps focus.
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
          // aria-disabled instead of disabled, so the toggle keeps focus while the image is copied.
          aria-disabled={busy}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={
            isCopying ? "Copying…" : `Export options: ${shownPixelRatio}×, ${formatLabel}`
          }
          aria-busy={isCopying}
          className={controls.splitToggle}
        >
          {/* The panel closes when the image starts copying, so the toggle shows that it's copying. */}
          <DropdownChevron open={open} busy={isCopying} />
        </button>
      </div>
      {open && (
        // A disclosure, not a dialog, so it doesn't trap focus. The toggle's aria-expanded and
        // aria-controls point to it. Choices keep it open, and the actions close it.
        <div
          id={panelId}
          role="group"
          aria-label="Export options"
          className={`popover ${controls.panel}`}
        >
          <div className="space-y-4">
            {/* Resolution applies to Copy, Download and the image URL. Format only applies to
                Download and the image URL, because Copy is always PNG. */}
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
          <div role="group" aria-labelledby={copyTitleId} className={controls.panelActions}>
            <p id={copyTitleId} className="field-label px-2 pt-1 pb-1">
              Copy
            </p>
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
              Image
            </button>
            <EmbedLinks
              {...banner}
              format={shownFormat}
              pixelRatio={shownPixelRatio}
              disabled={exportBlocked}
              onCopy={onCopyEmbed}
            />
          </div>
        </div>
      )}
    </div>
  );
}
