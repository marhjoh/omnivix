/** GitHub's rules: letters, digits and single hyphens (not at the ends), at most 39 characters. */
const GITHUB_USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function isGithubUsername(value: string): boolean {
  return GITHUB_USERNAME.test(value);
}

const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);

/**
 * Username from a pasted github.com profile link; other input is returned unchanged. Checks the
 * parsed host, so evil.example/github.com/octocat is not a match.
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
