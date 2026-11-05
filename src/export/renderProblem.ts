// Markers the render page shows instead of the banner when it can't draw it. The headless browser
// reads them (see captureBanner), so the export can say what went wrong.

/** GitHub's rate limit is used up. The value is the reset time as an ISO string. */
export const GITHUB_LIMIT_ATTRIBUTE = "data-github-limit-until";

/** The banner's GitHub user doesn't exist. */
export const GITHUB_USER_MISSING_ATTRIBUTE = "data-github-user-missing";
