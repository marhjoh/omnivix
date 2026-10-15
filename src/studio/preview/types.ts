export type PreviewContentState = "loading" | "empty" | "error" | "ready";

/** Why the preview can't show the banner: shown in place of it, and blocks export. */
export interface PreviewProblem {
  title: string;
  hint: string;
  /** Offer "Try again" (refetch); only useful when the problem may go away by itself. */
  retry: boolean;
}
