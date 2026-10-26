import type { PreviewContentState } from "./preview/types";

/**
 * Whether the Download button is disabled. The button has no message of its own: the preview shows
 * why (empty, loading or a problem), and an unusable image is reported with a toast.
 */
export function isExportBlocked(params: {
  previewState: PreviewContentState;
  stateValid: boolean;
  /** The background or the logo can't be used: it failed to load, or is an http link. */
  imageUnusable: boolean;
  /**
   * The preview still shows an earlier version while the current one loads (a quick load being
   * held, the previous year's grid, the previous background, or a logo still loading); a download
   * now wouldn't match it.
   */
  previewPending: boolean;
}): boolean {
  return (
    params.previewState !== "ready" ||
    !params.stateValid ||
    params.imageUnusable ||
    params.previewPending
  );
}
