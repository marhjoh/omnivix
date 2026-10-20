import { describe, expect, it } from "vitest";
import { isGithubUsername, usernameFromProfileLink } from "./githubUsername";

describe("isGithubUsername", () => {
  it("follows GitHub's rules", () => {
    expect(isGithubUsername("octocat")).toBe(true);
    expect(isGithubUsername("mona-lisa")).toBe(true);
    expect(isGithubUsername("-octocat")).toBe(false);
    expect(isGithubUsername("octo--cat")).toBe(false);
    expect(isGithubUsername("a".repeat(40))).toBe(false);
  });
});

describe("usernameFromProfileLink", () => {
  it("takes the username from a github.com profile link", () => {
    expect(usernameFromProfileLink("https://github.com/octocat")).toBe("octocat");
    expect(usernameFromProfileLink("http://www.github.com/octocat/")).toBe("octocat");
    expect(usernameFromProfileLink("github.com/octocat?tab=repositories")).toBe("octocat");
    expect(usernameFromProfileLink("github.com/octocat/hello-world")).toBe("octocat");
    expect(usernameFromProfileLink("GitHub.com/octocat")).toBe("octocat");
  });

  it("empties the field once the pasted link reaches github.com/", () => {
    expect(usernameFromProfileLink("github.com/")).toBe("");
  });

  it("leaves usernames and other hosts as typed", () => {
    expect(usernameFromProfileLink("octocat")).toBe("octocat");
    expect(usernameFromProfileLink("github.com")).toBe("github.com");
    expect(usernameFromProfileLink("https://evil.example/github.com/octocat")).toBe(
      "https://evil.example/github.com/octocat",
    );
    expect(usernameFromProfileLink("https://github.com.evil.example/octocat")).toBe(
      "https://github.com.evil.example/octocat",
    );
    expect(usernameFromProfileLink("javascript://github.com/octocat")).toBe(
      "javascript://github.com/octocat",
    );
  });
});
