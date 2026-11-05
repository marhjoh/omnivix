import { type ExportRequest, TEMPLATE_IDS } from "@/src/types/template";
import { THEMES } from "@/src/theme/theme";
import { Result, Schema, SchemaIssue } from "effect";
import type { z } from "zod";
import {
  BANNER_SIZE_KEYS,
  BANNER_SIZES,
  exportFormatFor,
  exportFormats,
  exportPixelRatios,
} from "@/src/lib/sizes";
import { EXPORT_PIXEL_RATIOS, EXPORT_FORMATS, type ExportFormat } from "@/src/export/format";
import { templateRegistry } from "@/src/templates/registry";

/** One of `values`, with the message naming them all. */
function oneOf<const L extends ReadonlyArray<string | number>>(values: L) {
  const names = values.map((value) => (typeof value === "string" ? `"${value}"` : value));
  return Schema.Literals(values).annotate({ message: `Must be one of ${names.join(", ")}` });
}

/** The request's own fields. Each template's settings are checked by its zod `stateSchema`. */
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
export interface ExportIssue {
  path: string;
  message: string;
}

const issuePath = (path: ReadonlyArray<PropertyKey>, prefix?: string) =>
  [prefix, ...path.map(String)].filter((part) => part !== undefined).join(".") || "request";

// Every field has its own message (above), so no message repeats the request's values.
const formatIssues = SchemaIssue.makeFormatterStandardSchemaV1({
  leafHook: (issue) =>
    issue._tag === "MissingKey" ? "Required" : SchemaIssue.defaultLeafHook(issue),
});

function schemaIssues(issue: SchemaIssue.Issue): ExportIssue[] {
  return formatIssues(issue).issues.map(({ path, message }) => ({
    path: issuePath((path ?? []).map((part) => (typeof part === "object" ? part.key : part))),
    message,
  }));
}

function zodIssues(error: z.ZodError, prefix: string): ExportIssue[] {
  return error.issues.map((issue) => ({
    path: issuePath(issue.path, prefix),
    message: issue.message,
  }));
}

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
  if (Result.isFailure(decoded)) return { ok: false, issues: schemaIssues(decoded.failure.issue) };
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
  const { stateSchema, initialState } = templateRegistry[request.templateId];
  const merged = { ...initialState, ...request.state, size };
  const state = stateSchema.safeParse(merged);
  if (!state.success) return { ok: false, issues: zodIssues(state.error, "state") };
  return { ok: true, request: { ...request, format, state: { ...merged, ...state.data } } };
}
