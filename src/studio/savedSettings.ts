import { MAX_REPOS, parseRepoSelection, selectedReposOf } from "@/src/lib/repoSelection";
import { normalizeBannerSize, type BannerSize } from "@/src/lib/sizes";
import { templateRegistry } from "@/src/templates/registry";
import type { TemplateId } from "@/src/templates/types";
import { DEFAULT_GRID_COLORS_ID, GRID_COLOR_IDS } from "@/src/banner/gridColors";
import { oneOfOr } from "@/src/lib/isOneOf";
import { presetBySrc } from "@/src/backgrounds/presets";
import { alignmentAt } from "@/src/banner/contentPosition";
import { isQuoteColor } from "@/src/banner/quoteStyle";
import { clampPosition, isPosition } from "@/src/banner/position";
import { isHttpsUrl } from "@/src/lib/imageSource";

/**
 * Each image setting with the settings that belong to that image. A background's position and zoom
 * go when the background changes. The logo's position and size stay for the next logo.
 */
export const IMAGE_SETTINGS: Record<string, readonly string[]> = {
  backgroundImage: ["backgroundPosition", "backgroundZoom"],
  logoImage: [],
};

/** True for an https link or a built-in background. Uploads can't be saved or linked. */
export function isSavableImage(key: string, value: unknown): value is string {
  if (typeof value !== "string") return false;
  return isHttpsUrl(value) || (key === "backgroundImage" && !!presetBySrc(value));
}

/** Removes the settings that belong to image setting `key`, such as a background's position. */
export function removeImageSettings(state: Record<string, unknown>, key: string): void {
  for (const related of IMAGE_SETTINGS[key] ?? []) delete state[related];
}

/** Removes an image setting and the settings that belong to it, in place. */
export function removeImage(state: Record<string, unknown>, key: string): void {
  delete state[key];
  removeImageSettings(state, key);
}

/** Removes images that can't be saved (uploads), with their settings, in place. */
export function removeUnsavableImages(state: Record<string, unknown>): void {
  for (const key of Object.keys(IMAGE_SETTINGS)) {
    if (state[key] !== undefined && !isSavableImage(key, state[key])) removeImage(state, key);
  }
}

/** Positions set by dragging in the preview. They aren't in the schema, so they're checked here. */
export const POSITION_KEYS = ["contentPosition", "backgroundPosition", "logoPosition"] as const;

/**
 * Applies saved settings over the template defaults. Saved values come from the browser and can be
 * out of date. A value the template doesn't offer falls back to the default.
 */
export function applySavedSettings(
  prev: Record<string, unknown>,
  templateId: TemplateId,
  saved: Record<string, unknown> | null,
  username: string | null,
): Record<string, unknown> {
  if (!saved && !username) return prev;
  const merged = { ...prev, ...saved };
  merged.size = normalizeBannerSize(merged.size, prev.size as BannerSize);
  for (const field of templateRegistry[templateId].schema) {
    const value = merged[field.key];
    const valid =
      field.type === "colorPicker"
        ? isQuoteColor(value)
        : !field.options || field.options.some((option) => option.value === value);
    if (!valid) merged[field.key] = prev[field.key];
  }
  if (templateRegistry[templateId].meta.needsUsername) {
    merged.username = username ?? "";
  }
  removeUnsavableImages(merged);
  for (const key of POSITION_KEYS) {
    const position = merged[key];
    if (isPosition(position)) merged[key] = clampPosition(position);
    else delete merged[key];
  }
  // A link can set the position and alignment separately. The position wins, like after a drag.
  if (isPosition(merged.contentPosition) && "alignment" in prev) {
    merged.alignment = alignmentAt(merged.contentPosition.x) ?? merged.alignment;
  }
  // The grid colors field has no options to check because its picker draws the presets itself.
  if ("themeId" in prev) {
    merged.themeId = oneOfOr(GRID_COLOR_IDS, merged.themeId, DEFAULT_GRID_COLORS_ID);
  }
  return clampSelectedRepos(templateId, merged);
}

/**
 * Caps the repos banner's selection at MAX_REPOS in Selected mode. Pinned mode leaves the selection
 * alone so it's still there when the user switches back.
 */
export function clampSelectedRepos(
  templateId: TemplateId,
  state: Record<string, unknown>,
): Record<string, unknown> {
  if (!templateRegistry[templateId].meta.githubData.includes("repos")) return state;
  if (state.mode !== "selected") return state;
  const parts = parseRepoSelection(selectedReposOf(state));
  if (parts.length <= MAX_REPOS) return state;
  return { ...state, selectedRepos: parts.slice(0, MAX_REPOS).join(", ") };
}
