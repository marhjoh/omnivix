import { CSSProperties } from "react";
import { BANNER_SIZES } from "@/src/lib/sizes";
import { BannerSize, TemplateId } from "@/src/types/template";
import { BannerRenderer } from "@/src/templates/BannerRenderer";
import { templateRegistry } from "@/src/templates/registry";
import { RenderData } from "@/src/templates/renderers/types";
import {
  type PreviewContentState,
  type PreviewProblem,
  PreviewEmptyState,
  PreviewErrorState,
  PreviewFrame,
  PreviewLoadingState,
  previewEmptyCopy,
  previewLoadingMessage,
} from "@/src/studio/preview";
import previewStyles from "@/src/studio/preview/preview.module.css";
import { cssFitWidth, fitScale } from "@/src/studio/preview/fitScale";
import { useElementSize } from "@/src/studio/preview/useElementSize";
import { BackgroundDragSurface } from "@/src/studio/preview/BackgroundDragSurface";
import type { BackgroundPosition } from "@/src/banner/background";

export function PreviewArtboard({
  templateId,
  size,
  state,
  data,
  previewState,
  problem,
  onRetry,
  onChangeUsername,
  backgroundAdjust,
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
  /** Set while the background is being adjusted: shows the drag surface over the preview. */
  backgroundAdjust?: {
    position: BackgroundPosition;
    zoom: number;
    onMove: (position: BackgroundPosition) => void;
    onDone: () => void;
  };
}) {
  const dims = BANNER_SIZES[size];
  const { meta } = templateRegistry[templateId];
  const emptyCopy = previewEmptyCopy(meta.needsUsername);
  const loadingMessage = previewLoadingMessage(meta.githubData);
  const [stageRef, available] = useElementSize<HTMLDivElement>();
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
            <BannerRenderer templateId={templateId} state={state} data={data} />
          </div>
        ) : null}
        {previewState === "ready" && scale !== null && backgroundAdjust ? (
          <BackgroundDragSurface {...backgroundAdjust} frame={dims} scale={scale} />
        ) : null}
        {previewState === "ready" ? null : (
          <PreviewFrame>
            <div className={previewStyles.stateCenter}>
              {previewState === "loading" ? (
                <PreviewLoadingState message={loadingMessage} />
              ) : previewState === "empty" ? (
                <PreviewEmptyState title={emptyCopy.title} description={emptyCopy.description} />
              ) : problem ? (
                <PreviewErrorState
                  message={problem.title}
                  hint={problem.hint}
                  action={
                    problem.action === "retry"
                      ? { label: "Try again", onClick: onRetry }
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
