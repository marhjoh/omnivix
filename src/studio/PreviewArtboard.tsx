import { CSSProperties } from "react";
import { BANNER_SIZES } from "@/src/lib/sizes";
import { BannerSize, TemplateId } from "@/src/types/template";
import { BannerRenderer } from "@/src/templates/BannerRenderer";
import { RenderData } from "@/src/templates/renderers/types";

export function PreviewArtboard({
  templateId,
  size,
  state,
  data,
}: {
  templateId: TemplateId;
  size: BannerSize;
  state: Record<string, unknown>;
  data: RenderData;
}) {
  const dims = BANNER_SIZES[size];
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
      <BannerRenderer templateId={templateId} state={state} data={data} />
    </div>
  );
}
