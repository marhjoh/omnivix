import { type ExportRequest, TEMPLATE_IDS } from "@/src/types/template";
import { THEMES } from "@/src/theme/theme";
import { z } from "zod";
import { BANNER_SIZE_KEYS } from "@/src/lib/sizes";
import { EXPORT_PIXEL_RATIOS } from "@/src/export/viewport";
import { EXPORT_FORMATS } from "@/src/export/format";
import { templateRegistry } from "@/src/templates/registry";

export const exportRequestSchema: z.ZodType<ExportRequest> = z.object({
  templateId: z.enum(TEMPLATE_IDS),
  size: z.enum(BANNER_SIZE_KEYS),
  state: z.record(z.string(), z.unknown()),
  pixelRatio: z.literal(EXPORT_PIXEL_RATIOS).optional(),
  format: z.enum(EXPORT_FORMATS).optional(),
  uiTheme: z.enum(THEMES).optional(),
});

/** A field that failed, e.g. `{ path: "state.username", message: "Required" }`; no values. */
export interface ExportIssue {
  path: string;
  message: string;
}

function toIssues(error: z.ZodError, prefix?: string): ExportIssue[] {
  return error.issues.map((issue) => ({
    path: [prefix, ...issue.path].filter((part) => part !== undefined).join(".") || "request",
    message: issue.message,
  }));
}

/**
 * Checks an export request. Settings start from the template's defaults, so a caller only sends
 * what it changes; unknown settings are kept for the renderer.
 */
export function parseExportRequest(
  body: unknown,
): { ok: true; request: ExportRequest } | { ok: false; issues: ExportIssue[] } {
  const parsed = exportRequestSchema.safeParse(body);
  if (!parsed.success) return { ok: false, issues: toIssues(parsed.error) };
  const { stateSchema, initialState } = templateRegistry[parsed.data.templateId];
  const merged = { ...initialState, ...parsed.data.state, size: parsed.data.size };
  const state = stateSchema.safeParse(merged);
  if (!state.success) return { ok: false, issues: toIssues(state.error, "state") };
  return { ok: true, request: { ...parsed.data, state: { ...merged, ...state.data } } };
}
