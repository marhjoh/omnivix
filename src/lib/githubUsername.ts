/** GitHub's rules: letters, digits and single hyphens (not at the ends), at most 39 characters. */
const GITHUB_USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function isGithubUsername(value: string): boolean {
  return GITHUB_USERNAME.test(value);
}

/** The banner's username, or "" when it has none. */
export function usernameOf(state: Record<string, unknown>): string {
  return typeof state.username === "string" ? state.username : "";
}

const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);

/**
 * Takes the username from a pasted github.com profile link and returns other input unchanged. It
 * checks the parsed host, so evil.example/github.com/octocat doesn't match.
 */
export function usernameFromProfileLink(input: string): string {
  if (!input.includes("/")) return input;
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return input;
  }
  const isGithub =
    (url.protocol === "https:" || url.protocol === "http:") && GITHUB_HOSTS.has(url.hostname);
  return isGithub ? (url.pathname.split("/")[1] ?? "") : input;
}
