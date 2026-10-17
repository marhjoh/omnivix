import { useId } from "react";
import { Copy, Download, Loader2, SlidersHorizontal } from "lucide-react";
import { EXPORT_PIXEL_RATIOS, type ExportPixelRatio } from "@/src/export/viewport";
import { EXPORT_FORMAT_DETAILS, EXPORT_FORMATS, type ExportFormat } from "@/src/export/format";
import {
  DropdownGroupLabel,
  DropdownList,
  DropdownOption,
  DropdownRoot,
  useDropdown,
} from "@/src/ui/Dropdown";
import { HoverHighlightItem } from "@/src/ui/HoverHighlight";
import { highlightItemClass } from "@/src/ui/highlightClasses";
import type { ExportKind } from "@/src/studio/useBannerExport";

/** Labeled from sm (the icon alone on phones); dimmed while disabled. */
const labeledItemClass = `${highlightItemClass} disabled:cursor-default disabled:opacity-40 sm:w-auto sm:px-[9px]`;

/** Export options, Copy and Download, for the studio header's right group. */
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
  /** The chosen format's size at 1×, for the pixel sizes in the resolution menu. */
  bannerSize: { width: number; height: number };
}) {
  const optionsMenu = useDropdown(useId());
  const formatLabel = EXPORT_FORMAT_DETAILS[format].label;
  const busy = exporting !== null;
  const isDownloading = exporting === "download";
  const isCopying = exporting === "copy";
  return (
    <>
      {/* Resolution applies to Copy and Download; format only to Download (Copy is always a PNG). */}
      <HoverHighlightItem id="export-options">
        <DropdownRoot dropdown={optionsMenu} className="relative">
          <button
            type="button"
            id={optionsMenu.triggerId}
            onClick={() => optionsMenu.setOpen((open) => !open)}
            disabled={busy}
            aria-haspopup="listbox"
            aria-expanded={optionsMenu.open}
            aria-controls={optionsMenu.open ? optionsMenu.listId : undefined}
            aria-label={`Export options: ${pixelRatio}×, ${formatLabel}`}
            className={labeledItemClass}
          >
            <SlidersHorizontal className="h-[18px] w-[18px] shrink-0" />
            <span className="hidden whitespace-nowrap sm:inline">
              {pixelRatio}× · {formatLabel}
            </span>
          </button>
          <DropdownList dropdown={optionsMenu} label="Export options" className="right-0 w-max">
            {/* One choice per group, so screen readers know the two selected options are separate. */}
            <div role="group" aria-label="Resolution">
              <DropdownGroupLabel>Resolution</DropdownGroupLabel>
              {EXPORT_PIXEL_RATIOS.map((ratio) => (
                <DropdownOption
                  key={ratio}
                  selected={ratio === pixelRatio}
                  onSelect={() => {
                    onPixelRatioChange(ratio);
                    optionsMenu.close();
                  }}
                >
                  {ratio}× · {bannerSize.width * ratio} × {bannerSize.height * ratio}
                </DropdownOption>
              ))}
            </div>
            <div role="group" aria-label="Download format">
              <DropdownGroupLabel>Download format</DropdownGroupLabel>
              {EXPORT_FORMATS.map((option) => (
                <DropdownOption
                  key={option}
                  selected={option === format}
                  onSelect={() => {
                    onFormatChange(option);
                    optionsMenu.close();
                  }}
                >
                  {EXPORT_FORMAT_DETAILS[option].label} · {EXPORT_FORMAT_DETAILS[option].hint}
                </DropdownOption>
              ))}
            </div>
          </DropdownList>
        </DropdownRoot>
      </HoverHighlightItem>
      <HoverHighlightItem id="copy">
        <button
          type="button"
          onClick={onCopy}
          disabled={busy || exportBlocked}
          aria-label={isCopying ? "Copying…" : "Copy image"}
          aria-busy={isCopying}
          className={labeledItemClass}
        >
          {isCopying ? (
            <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin" />
          ) : (
            <Copy className="h-[18px] w-[18px] shrink-0" />
          )}
          <span className="hidden sm:inline">Copy</span>
        </button>
      </HoverHighlightItem>
      {/*
        36px tall and round like the other header controls; icon-only on phones. The aria-labels
        name the format and what's copied, which the visible labels leave to the options button.
      */}
      <button
        className="btn-primary h-9 w-9 rounded-full p-0 sm:w-auto sm:min-w-[8.5rem] sm:px-4"
        onClick={onDownload}
        disabled={busy || exportBlocked}
        aria-label={isDownloading ? "Exporting…" : `Download ${formatLabel}`}
        aria-busy={isDownloading}
        type="button"
      >
        {isDownloading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="hidden sm:inline">Exporting&hellip;</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </>
        )}
      </button>
    </>
  );
}
