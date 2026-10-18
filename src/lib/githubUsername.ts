/** GitHub's rules: letters, digits and single hyphens (not at the ends), at most 39 characters. */
const GITHUB_USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function isGithubUsername(value: string): boolean {
  return GITHUB_USERNAME.test(value);
}
