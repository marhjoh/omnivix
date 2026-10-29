import { CSSProperties } from "react";
import { BANNER_SIZES, bannerViews, shownView, viewRect, type BannerView } from "@/src/lib/sizes";
import { BannerSize, TemplateId } from "@/src/types/template";
import { BannerRenderer } from "@/src/templates/BannerRenderer";
import { templateRegistry } from "@/src/templates/registry";
import { RenderData } from "@/src/templates/renderers/types";
import {
  type PreviewContentState,
  type PreviewProblem,
  PreviewMessage,
  PreviewFrame,
  PreviewLoadingState,
  previewEmptyCopy,
  previewLoadingMessage,
} from "@/src/studio/preview";
import previewStyles from "@/src/studio/preview/preview.module.css";
import { cssFitWidth, fitScale } from "@/src/studio/preview/fitScale";
import { useElementSize } from "@/src/studio/preview/useElementSize";
import { BackgroundDragSurface } from "@/src/studio/preview/BackgroundDragSurface";
import { PlacementDragSurface } from "@/src/studio/preview/PlacementDragSurface";
import { BANNER_CONTENT_ATTRIBUTE, BANNER_LOGO_ATTRIBUTE } from "@/src/banner/placement";
import type { Position } from "@/src/banner/position";
import { useTimeReached } from "@/src/studio/preview/useTimeReached";
import type { BackgroundPosition } from "@/src/banner/background";
import type { ContentPosition } from "@/src/banner/contentPosition";
import { PreviewPhotosContext } from "@/src/banner/Frame";
import { PreviewViewToggle } from "@/src/studio/preview/PreviewViewToggle";

/** How the preview's label ends for each view of a format that devices crop. */
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
  onRetry,
  onChangeUsername,
  onEditSetting,
  backgroundAdjust,
  contentAdjust,
  logoAdjust,
}: {
  templateId: TemplateId;
  size: BannerSize;
  /** What the preview shows of a format that devices crop (YouTube, Reddit); others show all. */
  view: BannerView;
  onViewChange: (view: BannerView) => void;
  state: Record<string, unknown>;
  data: RenderData;
  previewState: PreviewContentState;
  /** Shown in place of the banner when `previewState` is "error". */
  problem: PreviewProblem | null;
  onRetry: () => void;
  onChangeUsername: () => void;
  /** Opens the settings with the cursor in this setting's field. */
  onEditSetting: (key: string) => void;
  /** Set when the banner has a background that can be moved: the preview can then be dragged. */
  backgroundAdjust?: {
    position: BackgroundPosition;
    zoom: number;
    onMove: (position: BackgroundPosition) => void;
  };
  /** Set when the banner's content can be moved (not when it fills the banner). */
  contentAdjust?: {
    position: ContentPosition;
    onMove: (position: ContentPosition) => void;
  };
  /** Set when the banner has a logo that shows. */
  logoAdjust?: {
    position: Position;
    onMove: (position: Position) => void;
  };
}) {
  const dims = BANNER_SIZES[size];
  const { meta } = templateRegistry[templateId];
  const emptyCopy = previewEmptyCopy(meta.needsUsername);
  const loadingMessage = previewLoadingMessage(meta.githubData);
  const [stageRef, available] = useElementSize<HTMLDivElement>();
  const retryReached = useTimeReached(problem?.retryAt);
  const views = bannerViews(dims);
  const activeView = shownView(dims, view);
  // The part of the banner the preview shows: all of it, unless devices crop the format.
  const shown = viewRect(dims, activeView);
  const scale = available ? fitScale(available, shown) : null;

  // Until the stage is measured (before the page's JavaScript runs), CSS does the same fit with
  // the stage as a size container, so the banner shows at its final size from the first paint.
  // tan(atan2(a, b)) is a / b as a plain number, which scale() needs.
  const fitWidth = cssFitWidth(shown);
  const artboardStyle: CSSProperties =
    scale === null
      ? { width: fitWidth, aspectRatio: `${shown.width} / ${shown.height}` }
      : { width: shown.width * scale, height: shown.height * scale };
  const bannerScale = scale === null ? `tan(atan2(${fitWidth}, ${shown.width}px))` : String(scale);

  return (
    <>
      <div ref={stageRef} className={previewStyles.stage}>
        <div style={artboardStyle} className="omnivix-artboard" data-state={previewState}>
          {previewState === "ready" ? (
            // One image to screen readers, like the exported file.
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
                <BannerRenderer templateId={templateId} state={state} data={data} />
              </PreviewPhotosContext>
            </div>
          ) : null}
          {previewState === "ready" && scale !== null && backgroundAdjust ? (
            <BackgroundDragSurface {...backgroundAdjust} frame={dims} scale={scale} />
          ) : null}
          {previewState === "ready" && scale !== null && contentAdjust ? (
            <PlacementDragSurface
              {...contentAdjust}
              target={BANNER_CONTENT_ATTRIBUTE}
              name="content"
              frame={dims}
              shown={shown}
              scale={scale}
            />
          ) : null}
          {/* After the content's: the logo is on top where they meet. */}
          {previewState === "ready" && scale !== null && logoAdjust ? (
            <PlacementDragSurface
              {...logoAdjust}
              target={BANNER_LOGO_ATTRIBUTE}
              name="logo"
              frame={dims}
              shown={shown}
              scale={scale}
            />
          ) : null}
          {previewState === "ready" ? null : (
            <PreviewFrame>
              <div className={previewStyles.stateCenter}>
                {previewState === "loading" ? (
                  <PreviewLoadingState message={loadingMessage} />
                ) : previewState === "empty" ? (
                  <PreviewMessage
                    title={emptyCopy.title}
                    hint={emptyCopy.description}
                    action={{
                      label: emptyCopy.action.label,
                      onClick:
                        emptyCopy.action.setting === "username"
                          ? onChangeUsername
                          : () => onEditSetting(emptyCopy.action.setting),
                    }}
                  />
                ) : problem ? (
                  <PreviewMessage
                    alert
                    title={problem.title}
                    hint={problem.hint}
                    action={
                      problem.action === "retry"
                        ? { label: "Try again", onClick: onRetry, disabled: !retryReached }
                        : problem.action === "change-username"
                          ? { label: "Change username", onClick: onChangeUsername }
                          : undefined
                    }
                  />
                ) : null}
              </div>
            </PreviewFrame>
          )}
        </div>
      </div>
      {views.length ? (
        <PreviewViewToggle views={views} view={activeView} onChange={onViewChange} />
      ) : null}
    </>
  );
}
