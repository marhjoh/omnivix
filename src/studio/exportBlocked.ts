import type { PreviewContentState } from "./preview/types";

/**
 * Whether the Download button is disabled. The preview already shows why (empty, loading or a
 * problem), so the button needs no message of its own.
 */
export function isExportBlocked(params: {
  previewState: PreviewContentState;
  stateValid: boolean;
  /** The background image couldn't be loaded in the browser. */
  backgroundFailed: boolean;
}): boolean {
  return params.previewState !== "ready" || !params.stateValid || params.backgroundFailed;
}
