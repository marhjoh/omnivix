export interface GithubUserNormalized {
  login: string;
  name: string | null;
  avatarUrl: string;
  followers: number;
  publicRepos: number;
  contributionsLastYear: number;
  createdAt?: string;
}

export interface RepoNormalized {
  id: string;
  name: string;
  description: string | null;
  language: string | null;
  languageColor: string | null;
  stargazers: number;
  forks: number;
  url: string;
  isPinned: boolean;
}

export interface ContributionsNormalized {
  total: number;
  weeks: Array<{
    weekStart: string;
    days: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }>;
  }>;
}

function hash(input: string): number {
  return [...input].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 9973, 7);
}

export function mockContributions(username: string): ContributionsNormalized {
  const base = hash(username);
  const weeks = Array.from({ length: 52 }, (_, weekIndex) => {
    const days = Array.from({ length: 7 }, (_, dayIndex) => {
      const value = (base + weekIndex * 17 + dayIndex * 23) % 22;
      const level: 0 | 1 | 2 | 3 | 4 =
        value === 0 ? 0 : value < 5 ? 1 : value < 10 ? 2 : value < 16 ? 3 : 4;
      return {
        date: `w${weekIndex + 1}-d${dayIndex + 1}`,
        count: value,
        level,
      };
    });
    return {
      weekStart: `week-${weekIndex + 1}`,
      days,
    };
  });
  const total = weeks.flatMap((week) => week.days).reduce((acc, day) => acc + day.count, 0);
  return { total, weeks };
}
