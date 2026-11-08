import { describe, expect, it } from "vitest";
import type { RepoNormalized } from "@/src/github/types";
import { templateRegistry } from "@/src/templates/registry";
import { terminalRows } from "./terminal";

const initialState = templateRegistry["terminal-banner"].initialState;
const githubOff = {
  showRepoCount: false,
  showStarCount: false,
  showFollowerCount: false,
  showContributionCount: false,
  showStreak: false,
  showLanguages: false,
};

function repo(language: string | null, stargazers = 0): RepoNormalized {
  return {
    id: `${language}-${stargazers}`,
    name: "repo",
    description: null,
    language,
    languageColor: null,
    stargazers,
    forks: 0,
  };
}

describe("terminalRows", () => {
  it("shows typed rows in order, trimmed, and leaves out empty ones", () => {
    const state = {
      ...initialState,
      ...githubOff,
      role: " Developer ",
      location: "",
      editor: "  ",
      shell: "fish",
      os: "Linux",
    };
    expect(terminalRows(state, {})).toEqual([
      { label: "Role", value: "Developer" },
      { label: "Shell", value: "fish" },
      { label: "OS", value: "Linux" },
    ]);
  });

  it("adds the GitHub rows that are turned on, after the typed ones", () => {
    const state = { ...initialState, role: "", editor: "", shell: "", os: "Linux" };
    const repos = [repo("Go", 12_400), repo("Rust"), repo("Go"), repo("Python"), repo("Zig")];
    expect(
      terminalRows(state, {
        user: {
          login: "octocat",
          name: null,
          avatarUrl: "",
          createdAt: "",
          publicRepos: 5,
          followers: 1,
          following: 0,
          pullRequests: 0,
        },
        repos,
      }),
    ).toEqual([
      { label: "OS", value: "Linux" },
      { label: "Repos", value: "5" },
      { label: "Stars", value: "12.4K" },
      { label: "Followers", value: "1" },
      { label: "Contributions", value: "0" },
      { label: "Streak", value: "0 days, longest 0 days" },
      { label: "Languages", value: "Go, Python, Rust" },
    ]);
  });

  it("leaves out languages when no repository has one", () => {
    const state = { ...initialState, ...githubOff, showLanguages: true, role: "" };
    expect(terminalRows(state, { repos: [repo(null)] }).map(({ label }) => label)).toEqual([
      "Editor",
      "Shell",
      "OS",
    ]);
  });
});
