export type PreviewContentState = "loading" | "empty" | "error" | "ready";

/** Why the preview can't show the banner: shown in place of it, and blocks export. */
export interface PreviewProblem {
  title: string;
  hint: string;
  /**
   * Button under the message: "retry" refetches (for problems that may go away by themselves),
   * "change-username" opens the username dialog. None when only the sidebar can fix it.
   */
  action?: "retry" | "change-username";
  /** Until then "Try again" is disabled: it couldn't succeed earlier (GitHub's rate limit). */
  retryAt?: Date;
}
