import { ExportRequest } from "@/src/types/template";
import { z } from "zod";

export const exportRequestSchema: z.ZodType<ExportRequest> = z.object({
  templateId: z.enum(["github-banner", "repos-banner", "contribution-banner", "quote-banner"]),
  size: z.enum(["xHeader", "linkedinCover"]),
  state: z.record(z.string(), z.unknown()),
  format: z.literal("png"),
  scale: z.union([z.literal(1), z.literal(2)]),
  pixelRatio: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  uiTheme: z.enum(["light", "dark"]).optional(),
});
