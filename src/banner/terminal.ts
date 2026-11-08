import { contributionStreaks, formatCount, starsReceived, topLanguages } from "@/src/banner/stats";
import type { TemplateSettings } from "@/src/templates/stateSchemas";
import type { RenderData } from "@/src/templates/types";

type TerminalSettings = TemplateSettings["terminal-banner"];

/** The terminal banner's typed rows, in the order it shows them. Empty rows are left out. */
export const TERMINAL_TEXT_ROWS = [
  { key: "role", label: "Role" },
  { key: "location", label: "Location" },
  { key: "editor", label: "Editor" },
  { key: "shell", label: "Shell" },
  { key: "os", label: "OS" },
] as const;

export const TERMINAL_TEXT_MAX_LENGTH = 40;

/** Languages after this many are left out, so the row stays short. */
const MAX_LANGUAGES = 3;

export interface TerminalRow {
  label: string;
  value: string;
}

function days(count: number) {
  return `${count} ${count === 1 ? "day" : "days"}`;
}

/** The key/value rows: the typed ones first, then the GitHub ones that are turned on. */
export function terminalRows(
  state: TerminalSettings,
  { user, contributions, repos = [] }: RenderData,
): TerminalRow[] {
  const streaks = contributions ? contributionStreaks(contributions) : { current: 0, longest: 0 };
  const languages = topLanguages(repos, Infinity)
    .slice(0, MAX_LANGUAGES)
    .map(({ name }) => name)
    .join(", ");
  const githubRows: Array<[boolean, TerminalRow]> = [
    [state.showRepoCount, { label: "Repos", value: formatCount(user?.publicRepos ?? 0) }],
    [state.showStarCount, { label: "Stars", value: formatCount(starsReceived(repos)) }],
    [state.showFollowerCount, { label: "Followers", value: formatCount(user?.followers ?? 0) }],
    [
      state.showContributionCount,
      { label: "Contributions", value: formatCount(contributions?.total ?? 0) },
    ],
    [
      state.showStreak,
      {
        label: "Streak",
        value: `${days(streaks.current)}, longest ${days(streaks.longest)}`,
      },
    ],
    [state.showLanguages && languages !== "", { label: "Languages", value: languages }],
  ];
  return [
    ...TERMINAL_TEXT_ROWS.flatMap(({ key, label }) => {
      const value = state[key].trim();
      return value ? [{ label, value }] : [];
    }),
    ...githubRows.flatMap(([shown, row]) => (shown ? [row] : [])),
  ];
}
