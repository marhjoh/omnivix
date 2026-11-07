import type { BannerSize } from "@/src/lib/sizes";
import type { Theme } from "@/src/theme/theme";
import type { ExportFormat, ExportPixelRatio } from "@/src/export/format";
import type { BannerSettings, TemplateId } from "@/src/templates/types";

/**
 * The export API's request body. The studio sends the same shape (src/studio/useBannerExport.ts).
 */
export interface ExportRequest {
  templateId: TemplateId;
  size: BannerSize;
  state: BannerSettings;
  pixelRatio?: ExportPixelRatio;
  /** PNG when left out, or the size's first format if it doesn't take PNG. */
  format?: ExportFormat;
  /** Matches the studio's theme, so the export looks like the preview. */
  uiTheme?: Theme;
  /** Leaves out the theme's background color. PNG only, since JPEG has no transparency. */
  transparent?: boolean;
}
