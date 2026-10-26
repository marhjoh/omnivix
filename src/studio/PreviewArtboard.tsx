import { CSSProperties } from "react";
import { BANNER_SIZES } from "@/src/lib/sizes";
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
import { BANNER_CONTENT_ATTRIBUTE } from "@/src/banner/fit";
import { useTimeReached } from "@/src/studio/preview/useTimeReached";
import type { BackgroundPosition } from "@/src/banner/background";
import type { ContentPosition } from "@/src/banner/contentPosition";
import { PreviewPhotosContext } from "@/src/banner/Frame";

export function PreviewArtboard({
  templateId,
  size,
  state,
  data,
  previewState,
  problem,
  onRetry,
  onChangeUsername,
  onEditSetting,
  backgroundAdjust,
  contentAdjust,
}: {
  templateId: TemplateId;
  size: BannerSize;
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
}) {
  const dims = BANNER_SIZES[size];
  const { meta } = templateRegistry[templateId];
  const emptyCopy = previewEmptyCopy(meta.needsUsername);
  const loadingMessage = previewLoadingMessage(meta.githubData);
  const [stageRef, available] = useElementSize<HTMLDivElement>();
  const retryReached = useTimeReached(problem?.retryAt);
  const scale = available ? fitScale(available, dims) : null;

  // Until the stage is measured (before the page's JavaScript runs), CSS does the same fit with
  // the stage as a size container, so the banner shows at its final size from the first paint.
  // tan(atan2(a, b)) is a / b as a plain number, which scale() needs.
  const fitWidth = cssFitWidth(dims);
  const artboardStyle: CSSProperties =
    scale === null
      ? { width: fitWidth, aspectRatio: `${dims.width} / ${dims.height}` }
      : { width: dims.width * scale, height: dims.height * scale };
  const bannerScale = scale === null ? `tan(atan2(${fitWidth}, ${dims.width}px))` : String(scale);

  return (
    <div ref={stageRef} className={previewStyles.stage}>
      <div style={artboardStyle} className="omnivix-artboard" data-state={previewState}>
        {previewState === "ready" ? (
          <div
            className={previewStyles.scaled}
            style={{
              width: dims.width,
              height: dims.height,
              transform: `scale(${bannerScale})`,
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
  );
}
