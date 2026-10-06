import type { TemplateId } from "../types/template";
import { previewEmptyCopy } from "./preview/computePreviewContentState";
import type { PreviewContentState } from "./preview/types";

/**
 * Why the Download PNG button is disabled, or null when export is allowed.
 * Preview state is checked first: an empty or loading preview usually also fails the schema,
 * and its message is more useful.
 */
export function exportBlockedReason(params: {
  templateId: TemplateId;
  previewState: PreviewContentState;
  stateValid: boolean;
}): string | null {
  switch (params.previewState) {
    case "empty":
      return previewEmptyCopy(params.templateId).title;
    case "loading":
      return "Waiting for preview data…";
    case "error":
      return "Preview data failed to load";
  }
  if (!params.stateValid) return "Some settings are invalid";
  return null;
}
