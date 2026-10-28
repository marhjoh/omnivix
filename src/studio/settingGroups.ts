import type { EditorFieldSchema } from "@/src/types/template";

/** Sidebar names for settings whose schema label is unclear there. */
const LABELS: Record<string, string> = {
  size: "Platform",
  themeId: "Grid colors",
  maxRepos: "Number of repos",
  logoImage: "Image",
  logoSize: "Size",
};

/** The sidebar's name for a setting. */
export function fieldLabel(field: EditorFieldSchema): string {
  return LABELS[field.key] ?? field.label;
}

/** The group that also holds the app's light/dark setting (ControlSidebar). */
export const STYLE_GROUP = "Style";

const GROUPS: Array<{ title: string; keys: string[] | null }> = [
  { title: "Format", keys: ["size"] },
  { title: STYLE_GROUP, keys: ["themeId", "cellShape", "backgroundImage"] },
  {
    title: "Layout",
    keys: ["alignment", "profilePosition", "contentSize", "authorPosition", "authorSize"],
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
  // The logo's size shows inside its picker (ControlSidebar).
  { title: "Logo", keys: ["logoImage", "logoSize"] },
  { title: "Repositories", keys: ["mode", "selectedRepos", "maxRepos"] },
  // Everything else, in schema order: a new setting shows up here until it gets a place.
  { title: "Content", keys: null },
];

export interface SettingGroup {
  title: string;
  fields: EditorFieldSchema[];
}

/**
 * A template's settings grouped by what they change. The username is set elsewhere. Empty groups
 * are left out, except Style, which always holds the light/dark setting.
 */
export function groupFields(schema: EditorFieldSchema[]): SettingGroup[] {
  const fields = schema.filter((field) => field.key !== "username");
  const placed = new Set(GROUPS.flatMap((group) => group.keys ?? []));
  return GROUPS.map(({ title, keys }) => ({
    title,
    fields: keys
      ? keys.flatMap((key) => fields.filter((field) => field.key === key))
      : fields.filter((field) => !placed.has(field.key)),
  })).filter((group) => group.fields.length > 0 || group.title === STYLE_GROUP);
}
