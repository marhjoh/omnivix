import { type ExportRequest, TEMPLATE_IDS } from "@/src/types/template";
import { THEMES } from "@/src/theme/theme";
import { z } from "zod";
import { BANNER_SIZE_KEYS } from "@/src/lib/sizes";

export const exportRequestSchema: z.ZodType<ExportRequest> = z.object({
  templateId: z.enum(TEMPLATE_IDS),
  size: z.enum(BANNER_SIZE_KEYS),
  state: z.record(z.string(), z.unknown()),
  pixelRatio: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  uiTheme: z.enum(THEMES).optional(),
});
