import type { EditorFieldSchema } from "@/src/templates/types";

/** Sidebar names for settings whose schema label is unclear there. */
const LABELS: Record<string, string> = {
  size: "Platform",
  themeId: "Grid colors",
  maxRepos: "Number of repos",
  logoImage: "Image",
  logoSize: "Size",
};

export function fieldLabel(field: EditorFieldSchema): string {
  return LABELS[field.key] ?? field.label;
}

/** The group that also holds the app's light/dark setting (ControlSidebar). */
export const STYLE_GROUP = "Style";

const GROUPS: Array<{ title: string; keys: string[] | null }> = [
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
  // The logo's size shows inside its picker (LogoField in ImageFields.tsx).
  { title: "Logo", keys: ["logoImage", "logoSize"] },
  { title: "Repositories", keys: ["mode", "selectedRepos", "maxRepos"] },
  // Only the tech stack and intro banners have these.
  { title: "Icons", keys: ["icons", "iconsPerRow", "showLabels", "showIcons"] },
  // Only the stats and terminal banners have these.
  {
    title: "Stats",
    keys: [
      "showRepoCount",
      "showStarCount",
      "showFollowerCount",
      "showFollowingCount",
      "showPullRequestCount",
      "showContributionCount",
      "showCurrentStreak",
      "showLongestStreak",
      "showStreak",
      "showLanguages",
      "showOrganizations",
    ],
  },
  // Everything else, in schema order. New settings land here until they get a group.
  { title: "Content", keys: null },
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
