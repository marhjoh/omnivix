import { MAX_REPOS, parseRepoSelection } from "@/src/lib/repoSelection";
import { normalizeBannerSize } from "@/src/lib/sizes";
import { templateRegistry } from "@/src/templates/registry";
import type { BannerSize, TemplateId } from "@/src/types/template";
import { THEME_PRESETS } from "@/src/types/theme";
import { presetBySrc } from "@/src/backgrounds/presets";
import { alignmentAt } from "@/src/banner/contentPosition";
import { clampPosition, isPosition } from "@/src/banner/position";

/**
 * The banner's image settings, each with the settings that belong to that one image: a background's
 * position and zoom go with it.
 */
export const IMAGE_SETTINGS: Record<string, readonly string[]> = {
  backgroundImage: ["backgroundPosition", "backgroundZoom"],
};

/**
 * An image that can be saved and linked: an https link, or a built-in background. Not an upload,
 * which is too large.
 */
export function isSavableImage(key: string, value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^https:\/\//i.test(value) || (key === "backgroundImage" && !!presetBySrc(value));
}

/** Removes an image setting and the settings that belong to it, in place. */
export function removeImage(state: Record<string, unknown>, key: string): void {
  delete state[key];
  for (const related of IMAGE_SETTINGS[key] ?? []) delete state[related];
}

/** Positions set by dragging in the preview; not sidebar settings, so checked on their own. */
export const POSITION_KEYS = ["contentPosition", "backgroundPosition"] as const;

/**
 * The template's defaults with saved settings applied. Saved values come from the browser, so
 * anything the template no longer offers falls back to its default.
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
    if (field.options && !field.options.some((option) => option.value === merged[field.key])) {
      merged[field.key] = prev[field.key];
    }
  }
  if (templateRegistry[templateId].meta.needsUsername) {
    merged.username = username ?? "";
  }
  for (const key of Object.keys(IMAGE_SETTINGS)) {
    if (merged[key] !== undefined && !isSavableImage(key, merged[key])) removeImage(merged, key);
  }
  for (const key of POSITION_KEYS) {
    const position = merged[key];
    if (isPosition(position)) merged[key] = clampPosition(position);
    else delete merged[key];
  }
  // Content at the left, the center or the right has that alignment, as after a drag. A link can
  // set both apart, which in the quote banner would align the text differently from the sidebar.
  if (isPosition(merged.contentPosition) && "alignment" in prev) {
    merged.alignment = alignmentAt(merged.contentPosition.x) ?? merged.alignment;
  }
  const themeIds = new Set(THEME_PRESETS.map((p) => p.id));
  if (typeof merged.themeId !== "string" || !themeIds.has(merged.themeId)) {
    merged.themeId = "default";
  }
  return clampSelectedRepos(templateId, merged);
}

/**
 * Repos banner: at most MAX_REPOS selected. Only in Selected mode; Pinned mode's Amount doesn't
 * touch the selection, which is kept for switching back.
 */
export function clampSelectedRepos(
  templateId: TemplateId,
  state: Record<string, unknown>,
): Record<string, unknown> {
  if (!templateRegistry[templateId].meta.githubData.includes("repos")) return state;
  if (state.mode !== "selected") return state;
  const parts = parseRepoSelection(String(state.selectedRepos ?? ""));
  if (parts.length <= MAX_REPOS) return state;
  return { ...state, selectedRepos: parts.slice(0, MAX_REPOS).join(", ") };
}
