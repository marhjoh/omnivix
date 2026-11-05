import "server-only";
import { type ExportRequest, TEMPLATE_IDS } from "@/src/types/template";
import { THEMES } from "@/src/theme/theme";
import { Result, Schema } from "effect";
import { fieldIssues, oneOf, type FieldIssue } from "@/src/lib/schema";
import { checkTemplateState } from "@/src/templates/stateSchemas";
import {
  BANNER_SIZE_KEYS,
  BANNER_SIZES,
  exportFormatFor,
  exportFormats,
  exportPixelRatios,
} from "@/src/lib/sizes";
import { EXPORT_PIXEL_RATIOS, EXPORT_FORMATS, type ExportFormat } from "@/src/export/format";
import { templateRegistry } from "@/src/templates/registry";

/** The request's own fields; `state` is checked by the template's schema (stateSchemas.ts). */
export const exportRequestSchema = Schema.Struct({
  templateId: oneOf(TEMPLATE_IDS),
  size: oneOf(BANNER_SIZE_KEYS),
  state: Schema.Record(Schema.String, Schema.Unknown).annotate({ message: "Must be an object" }),
  pixelRatio: Schema.optional(oneOf(EXPORT_PIXEL_RATIOS)),
  format: Schema.optional(oneOf(EXPORT_FORMATS)),
  uiTheme: Schema.optional(oneOf(THEMES)),
}).annotate({ message: "Must be a JSON object" });

const decodeRequest = Schema.decodeUnknownResult(exportRequestSchema, { errors: "all" });

/** A field that failed, e.g. `{ path: "state.username", message: "Required" }`; no values. */
export type ExportIssue = FieldIssue;

/** A checked export request: its format is always set. */
export type ParsedExportRequest = ExportRequest & { format: ExportFormat };

/**
 * Checks an export request. Settings start from the template's defaults, so a caller only sends
 * what it changes; unknown settings are kept for the renderer. Without a format, the size's
 * default is used (JPEG for Reddit).
 */
export function parseExportRequest(
  body: unknown,
): { ok: true; request: ParsedExportRequest } | { ok: false; issues: ExportIssue[] } {
  const decoded = decodeRequest(body);
  if (Result.isFailure(decoded)) return { ok: false, issues: fieldIssues(decoded.failure.issue) };
  const request = { ...decoded.success, state: { ...decoded.success.state } };
  const { pixelRatio, size } = request;
  const formats = exportFormats(BANNER_SIZES[size]);
  if (request.format !== undefined && !formats.includes(request.format)) {
    const message = `Must be ${formats.map((file) => `"${file}"`).join(" or ")} for size "${size}"`;
    return { ok: false, issues: [{ path: "format", message }] };
  }
  const format = exportFormatFor(BANNER_SIZES[size], request.format);
  const ratios = exportPixelRatios(BANNER_SIZES[size], format);
  if (pixelRatio !== undefined && !ratios.includes(pixelRatio)) {
    const message = `Must be ${ratios.join(" or ")} for size "${size}" with format "${format}"`;
    return { ok: false, issues: [{ path: "pixelRatio", message }] };
  }
  const merged = { ...templateRegistry[request.templateId].initialState, ...request.state, size };
  const checked = checkTemplateState(request.templateId, merged);
  if (!checked.ok) return { ok: false, issues: checked.issues };
  return { ok: true, request: { ...request, format, state: { ...merged, ...checked.state } } };
}
