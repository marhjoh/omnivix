import { type ExportRequest, TEMPLATE_IDS } from "@/src/types/template";
import { THEMES } from "@/src/theme/theme";
import { z } from "zod";
import { BANNER_SIZE_KEYS } from "@/src/lib/sizes";
import { EXPORT_PIXEL_RATIOS } from "@/src/export/viewport";

export const exportRequestSchema: z.ZodType<ExportRequest> = z.object({
  templateId: z.enum(TEMPLATE_IDS),
  size: z.enum(BANNER_SIZE_KEYS),
  state: z.record(z.string(), z.unknown()),
  pixelRatio: z.literal(EXPORT_PIXEL_RATIOS).optional(),
  uiTheme: z.enum(THEMES).optional(),
});
