import { CSSProperties } from "react";
import {
  BANNER_SIZES,
  bannerViews,
  shownView,
  viewRect,
  type BannerSize,
  type BannerView,
} from "@/src/lib/sizes";
import { BannerRenderer } from "@/src/templates/BannerRenderer";
import { templateRegistry } from "@/src/templates/registry";
import type { BannerSettings, RenderData, TemplateId } from "@/src/templates/types";
import type { PreviewContentState, PreviewProblem } from "@/src/studio/preview/types";
import { previewLoadingMessage } from "@/src/studio/preview/computePreviewContentState";
import { PreviewStatus } from "@/src/studio/preview/PreviewStatus";
import previewStyles from "@/src/studio/preview/preview.module.css";
import { cssFitWidth, previewScale } from "@/src/studio/preview/previewScale";
import { useElementSize } from "@/src/studio/preview/useElementSize";
import { BackgroundDragSurface } from "@/src/studio/preview/BackgroundDragSurface";
import { PlacementDragSurface } from "@/src/studio/preview/PlacementDragSurface";
import { BANNER_CONTENT_ATTRIBUTE, BANNER_LOGO_ATTRIBUTE } from "@/src/banner/placement";
import type { Position } from "@/src/banner/position";
import { PreviewPhotosContext } from "@/src/banner/Frame";
import { PreviewViewToggle } from "@/src/studio/preview/PreviewViewToggle";
import { ExportProgress } from "@/src/studio/preview/ExportProgress";

/** The end of the preview's label for each device view. */
const VIEW_LABELS: Record<BannerView, string> = {
  phone: "as phones show it",
  desktop: "as desktop shows it",
  tv: "the full image TVs show",
};

export function PreviewArtboard({
  templateId,
  size,
  view,
  onViewChange,
  state,
  data,
  previewState,
  problem,
  missingSetting,
  exporting,
  transparent,
  onRetry,
  onChangeUsername,
  onEditSetting,
  backgroundAdjust,
  contentAdjust,
  logoAdjust,
}: {
  templateId: TemplateId;
  size: BannerSize;
  /** The device crop to show, for formats that devices crop. Others show the whole banner. */
  view: BannerView;
  onViewChange: (view: BannerView) => void;
  state: BannerSettings;
  data: RenderData;
  previewState: PreviewContentState;
  /** Shown in place of the banner when `previewState` is "error". */
  problem: PreviewProblem | null;
  /** What the banner waits for when `previewState` is "empty": "username", or a setting's key. */
  missingSetting: string | undefined;
  /** While true, the preview shows export progress and nothing can be dragged. */
  exporting: boolean;
  /** Shows the banner without its background color, over a checkerboard. */
  transparent: boolean;
  onRetry: () => void;
  onChangeUsername: () => void;
  /** Opens the settings with the cursor in this setting's field. */
  onEditSetting: (key: string) => void;
  /** Set when the banner has a background that can be moved. */
  backgroundAdjust?: {
    position: Position;
    zoom: number;
    onMove: (position: Position) => void;
  };
  /** Set when the banner's content can be moved (not when it fills the banner). */
  contentAdjust?: {
    position: Position;
    onMove: (position: Position) => void;
  };
  /** Set when the banner has a logo that shows. */
  logoAdjust?: {
    position: Position;
    onMove: (position: Position) => void;
  };
}) {
  const dims = BANNER_SIZES[size];
  const { meta, initialState } = templateRegistry[templateId];
  const [stageRef, available] = useElementSize<HTMLDivElement>();
  const views = bannerViews(dims);
  const activeView = shownView(dims, view);
  // The part of the banner the preview shows: all of it, unless devices crop the format.
  const shown = viewRect(dims, activeView);
  const scale = available ? previewScale(available, shown) : null;

  // Until the stage is measured, CSS does the same fit using the stage as a size container. That
  // way the banner has its final size from the first paint, before the page's JavaScript runs.
  // tan(atan2(a, b)) turns a / b into a unitless number, which scale() needs.
  const fitWidth = cssFitWidth(shown);
  const artboardStyle: CSSProperties =
    scale === null
      ? { width: fitWidth, aspectRatio: `${shown.width} / ${shown.height}` }
      : { width: shown.width * scale, height: shown.height * scale };
  const bannerScale = scale === null ? `tan(atan2(${fitWidth}, ${shown.width}px))` : String(scale);

  return (
    <>
      <div ref={stageRef} className={previewStyles.stage}>
        <div
          style={artboardStyle}
          className="omnivix-artboard"
          data-state={previewState}
          data-transparent={transparent || undefined}
        >
          {previewState === "ready" ? (
            <>
              {/* One image to screen readers, like the exported file. */}
              <div
                className={previewStyles.scaled}
                role="img"
                aria-label={`${meta.title} preview, ${dims.label}${views.length ? `, ${VIEW_LABELS[activeView]}` : ""}`}
                style={{
                  width: dims.width,
                  height: dims.height,
                  transform: `scale(${bannerScale}) translate(${-shown.left}px, ${-shown.top}px)`,
                }}
              >
                <PreviewPhotosContext value>
                  <BannerRenderer
                    templateId={templateId}
                    state={state}
                    data={data}
                    transparent={transparent}
                  />
                </PreviewPhotosContext>
              </div>
              {/* No dragging during an export. The file uses the positions from the click. */}
              {scale !== null && !exporting && (
                <>
                  {backgroundAdjust && (
                    <BackgroundDragSurface {...backgroundAdjust} frame={dims} scale={scale} />
                  )}
                  {contentAdjust && (
                    <PlacementDragSurface
                      {...contentAdjust}
                      target={BANNER_CONTENT_ATTRIBUTE}
                      name="content"
                      frame={dims}
                      shown={shown}
                      scale={scale}
                    />
                  )}
                  {/* After the content's surface, so the logo is on top where they overlap. */}
                  {logoAdjust && (
                    <PlacementDragSurface
                      {...logoAdjust}
                      target={BANNER_LOGO_ATTRIBUTE}
                      name="logo"
                      frame={dims}
                      shown={shown}
                      scale={scale}
                    />
                  )}
                </>
              )}
              <ExportProgress running={exporting} />
            </>
          ) : (
            <PreviewStatus
              previewState={previewState}
              problem={problem}
              missingSetting={missingSetting}
              loadingMessage={previewLoadingMessage(meta.githubData, "feed" in initialState)}
              onRetry={onRetry}
              onChangeUsername={onChangeUsername}
              onEditSetting={onEditSetting}
            />
          )}
        </div>
      </div>
      {views.length ? (
        <PreviewViewToggle views={views} view={activeView} onChange={onViewChange} />
      ) : null}
    </>
  );
}
