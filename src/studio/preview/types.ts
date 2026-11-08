export type PreviewContentState = "loading" | "empty" | "error" | "ready";

/** Why the preview can't show the banner. Shown instead of it, and blocks export. */
export interface PreviewProblem {
  title: string;
  hint: string;
  /**
   * The button under the message. "retry" refetches, for problems that may go away on their own.
   * "change-username" opens the username dialog and "change-feed" the feed dialog. Left out when
   * only the sidebar can fix it.
   */
  action?: "retry" | "change-username" | "change-feed";
  /** "Try again" stays disabled until then, e.g. until a rate limit resets. */
  retryAt?: Date;
}
