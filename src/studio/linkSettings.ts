import { templateRegistry } from "@/src/templates/registry";
import type { TemplateId } from "@/src/types/template";
import { isGithubUsername } from "@/src/lib/githubUsername";
import {
  IMAGE_SETTINGS,
  isSavableImage,
  POSITION_KEYS,
  removeImage,
} from "@/src/studio/savedSettings";
import { parsePositionText } from "@/src/banner/position";
import { parseAuthorPositionText } from "@/src/banner/authorPosition";

/** Settings from a studio link, with the username apart (it's saved for every template). */
export interface LinkSettings {
  settings: Record<string, unknown>;
  username: string | null;
}

type Query = Record<string, string | string[] | undefined>;

/**
 * Reads a studio link's query, e.g. `?username=octocat&size=header&themeId=sunset`: the export
 * API's `size` and `state` keys, as text, with positions as `x,y` (`contentPosition=100,0`).
 * Values that aren't valid are left out, so the studio uses the saved setting or the default
 * instead.
 */
export function parseLinkSettings(templateId: TemplateId, query: Query): LinkSettings | null {
  const { schema, stateSchema, initialState, meta } = templateRegistry[templateId];
  const fieldTypes = new Map<string, string>(schema.map((field) => [field.key, field.type]));
  if (meta.needsUsername) fieldTypes.set("username", "text");
  for (const key of POSITION_KEYS) fieldTypes.set(key, "position");

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
    } else if (key in IMAGE_SETTINGS) {
      if (isSavableImage(key, value)) candidate[key] = value;
    } else if (type === "position") {
      const position = parsePositionText(value);
      if (position) candidate[key] = position;
    } else if (type === "authorPosition") {
      const position = parseAuthorPositionText(value);
      if (position) candidate[key] = position;
    } else {
      candidate[key] = value;
    }
  }
  if (Object.keys(candidate).length === 0) return null;

  // Drop the values the template's rules reject. A placeholder username keeps a link without one
  // from failing on it.
  const result = stateSchema.safeParse({ ...initialState, username: "user", ...candidate });
  if (!result.success) {
    for (const issue of result.error.issues) delete candidate[String(issue.path[0])];
  }
  const { username, ...settings } = candidate;
  return { settings, username: typeof username === "string" ? username : null };
}

/**
 * Saved settings with a link's applied over them. A linked image replaces the saved settings that
 * belong to the saved image, such as a background's position and zoom.
 */
export function withLink(
  saved: { settings: Record<string, unknown> | null; username: string | null },
  link: LinkSettings | null,
): { settings: Record<string, unknown> | null; username: string | null } {
  if (!link) return saved;
  const settings = { ...saved.settings };
  for (const key of Object.keys(IMAGE_SETTINGS)) {
    if (key in link.settings) removeImage(settings, key);
  }
  return { settings: { ...settings, ...link.settings }, username: link.username ?? saved.username };
}
