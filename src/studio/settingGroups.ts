import type { EditorFieldSchema } from "@/src/templates/types";

/** Sidebar names for settings whose schema label is unclear there. */
const LABELS: Record<string, string> = {
  maxRepos: "Number of repos",
  logoImage: "Image",
  logoSize: "Size",
  credit: "Style",
  creditContent: "Shows",
  creditSize: "Size",
};

export function fieldLabel(field: EditorFieldSchema): string {
  return LABELS[field.key] ?? field.label;
}

/** The group that also holds the app's light/dark setting (ControlSidebar). */
export const STYLE_GROUP = "Style";

const GROUPS: Array<{ title: string; keys: string[] | null }> = [
  // Only the AI usage and latest posts banners have these. They're at the top, like the GitHub
  // banners' Profile.
  { title: "Usage", keys: ["usage"] },
  { title: "Feed", keys: ["feed", "postCount", "showDates"] },
  { title: "Format", keys: ["size"] },
  { title: STYLE_GROUP, keys: ["themeId", "cellShape", "showIconColors", "backgroundImage"] },
  {
    title: "Layout",
    keys: ["alignment", "profilePosition", "contentSize", "authorSize"],
  },
  // Only the quote banner has these.
  {
    title: "Typography",
    keys: [
      "font",
      "fontStyle",
      "quoteColor",
      "quoteMarks",
      "markColor",
      "authorPrefix",
      "authorColor",
    ],
  },
  // Only the certifications banner has these.
  {
    title: "Certifications",
    keys: ["certifications", "badgesPerRow", "showIssuer", "showYear"],
  },
  // Only the intro banner has these.
  { title: "Intro", keys: ["name", "headline", "tagline", "photoImage", "showHeadline"] },
  {
    title: "Links",
    keys: ["github", "linkedin", "x", "website", "email", "showLinks"],
  },
  // Only the terminal banner has these.
  {
    title: "Terminal",
    keys: [
      "keyColor",
      "role",
      "location",
      "editor",
      "shell",
      "os",
      "showColorBlocks",
      "showWindow",
    ],
  },
  { title: "Repositories", keys: ["mode", "selectedRepos", "maxRepos"] },
  // Only the tech stack and intro banners have these.
  { title: "Icons", keys: ["icons", "iconsPerRow", "showLabels", "showIcons"] },
  // Only the stats, terminal and AI usage banners have these.
  {
    title: "Stats",
    keys: [
      "showRepoCount",
      "showStarCount",
      "showFollowerCount",
      "showFollowingCount",
      "showPullRequestCount",
      "showContributionCount",
      "showTokenCount",
      "showCost",
      "showActiveDays",
      "showCurrentStreak",
      "showLongestStreak",
      "showStreak",
      "showLanguages",
      "showOrganizations",
      "showHeatmap",
      "showModels",
      "showAgents",
    ],
  },
  // Everything else, in schema order. New settings land here until they get a group.
  { title: "Content", keys: null },
  { title: "Logo", keys: ["logoImage", "logoSize"] },
  { title: "Credit", keys: ["credit", "creditContent", "creditSize"] },
];

export interface SettingGroup {
  title: string;
  fields: EditorFieldSchema[];
}

/**
 * Groups a template's settings for the sidebar. The username has its own field and isn't included.
 * Empty groups are dropped, except Style, which always has the light/dark setting.
 */
export function groupFields(fields: EditorFieldSchema[]): SettingGroup[] {
  const placed = new Set(GROUPS.flatMap((group) => group.keys ?? []));
  return GROUPS.map(({ title, keys }) => ({
    title,
    fields: keys
      ? keys.flatMap((key) => fields.filter((field) => field.key === key))
      : fields.filter((field) => !placed.has(field.key)),
  })).filter((group) => group.fields.length > 0 || group.title === STYLE_GROUP);
}
