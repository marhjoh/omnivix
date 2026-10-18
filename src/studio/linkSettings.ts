import { templateRegistry } from "@/src/templates/registry";
import type { TemplateId } from "@/src/types/template";
import { isGithubUsername } from "@/src/studio/studioCookies";
import { isSavableBackground } from "@/src/studio/savedSettings";

/**
 * Settings from a studio link's query, e.g. `?username=octocat&size=header&themeId=sunset`: the
 * export API's `size` and `state` keys, as text. Values that aren't valid are left out, so the
 * studio uses its saved setting or the default instead.
 */
export interface LinkSettings {
  settings: Record<string, unknown>;
  username: string | null;
}

type Query = Record<string, string | string[] | undefined>;

export function parseLinkSettings(templateId: TemplateId, query: Query): LinkSettings | null {
  const { schema, stateSchema, initialState, meta } = templateRegistry[templateId];
  const fieldTypes = new Map(schema.map((field) => [field.key, field.type]));
  if (meta.needsUsername) fieldTypes.set("username", "text");

  const candidate: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(query)) {
    const value = Array.isArray(raw) ? raw[0] : raw;
    const type = fieldTypes.get(key);
    if (value === undefined || !type) continue;
    if (key === "username") {
      if (isGithubUsername(value)) candidate.username = value;
    } else if (type === "toggle") {
      if (value === "true" || value === "false") candidate[key] = value === "true";
    } else if (type === "range") {
      if (value.trim() !== "" && Number.isFinite(Number(value))) candidate[key] = Number(value);
    } else if (type === "backgroundPicker") {
      if (isSavableBackground(value)) candidate[key] = value;
    } else {
      candidate[key] = value;
    }
  }
  if (Object.keys(candidate).length === 0) return null;

  // Check every value with the template's rules, on top of its defaults, and drop the ones that fail.
  const result = stateSchema.safeParse({ ...initialState, username: "user", ...candidate });
  if (!result.success) {
    for (const issue of result.error.issues) delete candidate[String(issue.path[0])];
  }
  const { username, ...settings } = candidate;
  return { settings, username: typeof username === "string" ? username : null };
}
