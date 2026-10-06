import { CSSProperties } from "react";
import { BANNER_SIZES } from "@/src/lib/sizes";
import { BannerSize, TemplateId } from "@/src/types/template";
import { BannerRenderer } from "@/src/templates/BannerRenderer";
import { RenderData } from "@/src/templates/renderers/types";
import type { PreviewContentState } from "@/src/studio/preview/types";
import {
  PreviewEmptyState,
  PreviewErrorState,
  PreviewFrame,
  PreviewLoadingState,
  previewEmptyCopy,
  previewLoadingMessage,
} from "@/src/studio/preview";
import previewStyles from "@/src/studio/preview/preview.module.css";
import { fitScale } from "@/src/studio/preview/fitScale";
import { useElementSize } from "@/src/studio/preview/useElementSize";

export function PreviewArtboard({
  templateId,
  size,
  state,
  data,
  previewState,
  dataError,
  onRetryError,
}: {
  templateId: TemplateId;
  size: BannerSize;
  state: Record<string, unknown>;
  data: RenderData;
  previewState: PreviewContentState;
  dataError: string | null;
  onRetryError?: () => void;
}) {
  const dims = BANNER_SIZES[size];
  const emptyCopy = previewEmptyCopy(templateId);
  const loadingMessage = previewLoadingMessage(templateId);
  const [stageRef, available] = useElementSize<HTMLDivElement>();
  const scale = available ? fitScale(available, dims) : null;

  // Until the stage is measured, fall back to a CSS aspect-ratio box and hide the banner.
  const artboardStyle: CSSProperties =
    scale === null
      ? { width: "100%", maxWidth: dims.width, aspectRatio: `${dims.width} / ${dims.height}` }
      : { width: dims.width * scale, height: dims.height * scale };

  return (
    <div ref={stageRef} className={previewStyles.stage}>
      <div style={artboardStyle} className="omnivix-artboard" data-state={previewState}>
        {previewState === "ready" ? (
          <div
            className={previewStyles.scaled}
            style={{
              width: dims.width,
              height: dims.height,
              transform: `scale(${scale ?? 1})`,
              visibility: scale === null ? "hidden" : undefined,
            }}
          >
            <BannerRenderer templateId={templateId} state={state} data={data} isExport={false} />
          </div>
        ) : (
          <PreviewFrame>
            <div className={previewStyles.stateCenter}>
              {previewState === "loading" ? (
                <PreviewLoadingState message={loadingMessage} />
              ) : previewState === "empty" ? (
                <PreviewEmptyState title={emptyCopy.title} description={emptyCopy.description} />
              ) : (
                <PreviewErrorState
                  message={dataError ?? "Something went wrong"}
                  hint="Check the username or your connection, then try again."
                  onRetry={onRetryError}
                />
              )}
            </div>
          </PreviewFrame>
        )}
      </div>
    </div>
  );
}
