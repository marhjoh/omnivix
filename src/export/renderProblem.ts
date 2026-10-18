// Why the export's render page couldn't draw the banner. It renders a marker instead, and the
// headless browser reads it (see captureBanner), so the export can say why it failed.

/** GitHub's rate limit is reached; holds the reset time (ISO). */
export const GITHUB_LIMIT_ATTRIBUTE = "data-github-limit-until";

/** The banner's GitHub user doesn't exist. */
export const GITHUB_USER_MISSING_ATTRIBUTE = "data-github-user-missing";

/** The banner's GitHub user doesn't exist, so retrying can't help. */
export class GithubUserNotFoundError extends Error {
  constructor() {
    super("The GitHub user doesn't exist");
    this.name = "GithubUserNotFoundError";
  }
}
