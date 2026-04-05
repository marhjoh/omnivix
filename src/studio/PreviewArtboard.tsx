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

  return (
    <div
      style={
        {
          "--banner-width": String(dims.width),
          "--banner-height": String(dims.height),
        } as CSSProperties
      }
      className="omnivix-artboard"
    >
      <div className="omnivix-safe-area" />
      <PreviewFrame>
        {previewState === "ready" ? (
          <div className={previewStyles.bannerSlot}>
            <BannerRenderer templateId={templateId} state={state} data={data} isExport={false} />
          </div>
        ) : (
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
        )}
      </PreviewFrame>
    </div>
  );
}
