import type { EditorFieldSchema } from "@/src/types/template";

/** Clearer names than the schema's for settings the sidebar groups and shows side by side. */
const LABELS: Record<string, string> = {
  size: "Aspect ratio",
  themeId: "Grid colors",
  contentSize: "Content size",
  maxRepos: "Number of repos",
  showTotal: "Total",
};

/** The sidebar's name for a setting. */
export function fieldLabel(field: EditorFieldSchema): string {
  return LABELS[field.key] ?? field.label;
}

const GROUPS: Array<{ title: string; keys: string[] | null }> = [
  { title: "Format", keys: ["size"] },
  { title: "Style", keys: ["themeId", "cellShape", "backgroundImage"] },
  { title: "Layout", keys: ["alignment", "profilePosition", "contentSize"] },
  { title: "Repositories", keys: ["mode", "selectedRepos", "maxRepos"] },
  // Everything else, in schema order: a new setting shows up here until it gets a place.
  { title: "Content", keys: null },
];

export interface SettingGroup {
  title: string;
  fields: EditorFieldSchema[];
}

/** A template's settings grouped by what they change. The username is set elsewhere. */
export function groupFields(schema: EditorFieldSchema[]): SettingGroup[] {
  const fields = schema.filter((field) => field.key !== "username");
  const placed = new Set(GROUPS.flatMap((group) => group.keys ?? []));
  return GROUPS.map(({ title, keys }) => ({
    title,
    fields: keys
      ? keys.flatMap((key) => fields.filter((field) => field.key === key))
      : fields.filter((field) => !placed.has(field.key)),
  })).filter((group) => group.fields.length > 0);
}
