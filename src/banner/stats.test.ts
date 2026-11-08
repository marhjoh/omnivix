import { describe, expect, it } from "vitest";
import type { ContributionsNormalized, RepoNormalized } from "@/src/github/types";
import { contributionStreaks, formatCount, topLanguages } from "./stats";

/** One week per 7 counts, from 2026-01-04 (a Sunday). The range ends on the last count. */
function calendar(counts: number[]): ContributionsNormalized {
  const days = counts.map((count, i) => ({
    date: new Date(Date.UTC(2026, 0, 4 + i)).toISOString().slice(0, 10),
    count,
    level: (count ? 1 : 0) as 0 | 1,
    weekday: (i % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
  }));
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, w) => ({
    firstDay: days[w * 7].date,
    days: days.slice(w * 7, w * 7 + 7),
  }));
  return { total: 0, weeks, months: [], rangeEndYmd: days.at(-1)!.date };
}

describe("contributionStreaks", () => {
  it("finds the longest run and the one that reaches the last day", () => {
    expect(contributionStreaks(calendar([1, 1, 1, 0, 2, 2]))).toEqual({ current: 2, longest: 3 });
  });

  it("keeps the current streak when the last day has nothing yet", () => {
    expect(contributionStreaks(calendar([0, 1, 1, 0]))).toEqual({ current: 2, longest: 2 });
  });

  it("ends the current streak after a quiet day before the last", () => {
    expect(contributionStreaks(calendar([1, 1, 0, 0]))).toEqual({ current: 0, longest: 2 });
  });

  it("ignores days after the range", () => {
    const contributions = { ...calendar([1, 0, 1, 1]), rangeEndYmd: "2026-01-05" };
    expect(contributionStreaks(contributions)).toEqual({ current: 1, longest: 1 });
  });
});

const repo = (language: string | null): RepoNormalized => ({
  id: String(Math.random()),
  name: "repo",
  description: null,
  language,
  languageColor: language ? "#000000" : null,
  stargazers: 0,
  forks: 0,
});

describe("topLanguages", () => {
  it("counts repositories per language, skipping those without one", () => {
    const repos = ["Go", "Go", "Rust", null].map(repo);
    expect(topLanguages(repos).map(({ name, share }) => [name, share])).toEqual([
      ["Go", 2 / 3],
      ["Rust", 1 / 3],
    ]);
  });

  it("adds up the languages past the limit as Other", () => {
    const repos = ["Go", "Go", "Rust", "C", "Zig"].map(repo);
    expect(topLanguages(repos, 3)).toEqual([
      { name: "Go", color: "#000000", share: 0.4 },
      { name: "C", color: "#000000", share: 0.2 },
      { name: "Other", color: null, share: 0.4 },
    ]);
  });
});

describe("formatCount", () => {
  it("writes small numbers in full and large ones short", () => {
    expect(formatCount(9_999)).toBe("9,999");
    expect(formatCount(12_345)).toBe("12.3K");
  });
});
