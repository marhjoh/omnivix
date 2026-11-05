import "server-only";
import { templateRegistry } from "@/src/templates/registry";
import type { TemplateId } from "@/src/templates/types";
import { isGithubUsername } from "@/src/lib/githubUsername";
import { IMAGE_SETTINGS, isSavableImage, POSITION_KEYS } from "@/src/studio/savedSettings";
import { parsePositionText } from "@/src/banner/position";
import { checkTemplateState } from "@/src/templates/stateSchemas";
import type { LinkSettings } from "@/src/studio/linkSettings";

type Query = Record<string, string | string[] | undefined>;

/**
 * Reads the query of a studio link or image URL, such as
 * `?username=octocat&size=header&themeId=sunset`. It uses the export API's `size` and `state` keys,
 * with positions written as `x,y` (`contentPosition=100,0`). Invalid values are dropped, and the
 * studio uses the saved setting or the default instead. Server only, because the template schemas
 * run on Effect. `linkQuery` in embedUrl.ts writes this query.
 */
export function parseLinkSettings(templateId: TemplateId, query: Query): LinkSettings | null {
  const { schema, initialState, meta } = templateRegistry[templateId];
  const fieldTypes = new Map<string, string>(schema.map((field) => [field.key, field.type]));
  if (meta.needsUsername) fieldTypes.set("username", "text");
  for (const key of POSITION_KEYS) fieldTypes.set(key, "position");
  fieldTypes.set("backgroundZoom", "range");

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
    } else {
      candidate[key] = value;
    }
  }
  if (Object.keys(candidate).length === 0) return null;

  // Drop the values the template rejects. The placeholder username stops a link without one from
  // failing the check.
  const checked = checkTemplateState(templateId, {
    ...initialState,
    username: "user",
    ...candidate,
  });
  if (!checked.ok) {
    // Paths are `state.<key>…`.
    for (const issue of checked.issues) delete candidate[issue.path.split(".")[1]];
  }
  const { username, ...settings } = candidate;
  return { settings, username: typeof username === "string" ? username : null };
}
