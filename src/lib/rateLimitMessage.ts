// Wording for a rate limit, shared by the GitHub API routes, the studio preview, the repository
// picker and the export, so every place says it the same way.

export const GITHUB_LIMIT_TITLE = "GitHub's limit is reached";

/** "Try again at 14:05.", in the visitor's own time and clock format. */
export function tryAgainAt(at: Date): string {
  return `Try again at ${at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`;
}

/** The full sentence, for a toast or the repository picker. */
export function githubLimitMessage(resetAt: Date): string {
  return `${GITHUB_LIMIT_TITLE}. ${tryAgainAt(resetAt)}`;
}
