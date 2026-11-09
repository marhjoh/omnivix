import { isRepoSelection, MAX_REPOS, parseRepoSelection } from "@/src/lib/repoSelection";
import { isIconSelection } from "@/src/icons/iconSelection";
import { BANNER_PLATFORMS, normalizeBannerSize } from "@/src/lib/sizes";
import { templateRegistry } from "@/src/templates/registry";
import type {
  BannerSettings,
  EditorFieldSchema,
  StudioSettings,
  TemplateId,
} from "@/src/templates/types";
import { GRID_COLOR_IDS } from "@/src/banner/gridColors";
import { oneOfOr } from "@/src/lib/isOneOf";
import { presetBySrc } from "@/src/backgrounds/presets";
import { MAX_BACKGROUND_ZOOM, MIN_BACKGROUND_ZOOM } from "@/src/banner/background";
import { alignmentAt } from "@/src/banner/contentPosition";
import { isQuoteColor } from "@/src/banner/quoteStyle";
import { clampPosition, isPosition } from "@/src/banner/position";
import { isHttpsUrl } from "@/src/lib/imageSource";
import { isContributionYear } from "@/src/lib/contributionYear";
import { isAiUsage } from "@/src/banner/aiUsage";
import { isCertifications } from "@/src/banner/certifications";
import { isFeedLink } from "@/src/banner/feed";

/**
 * Each image setting with the settings that belong to that image. A background's position goes
 * when the background changes. Its zoom and opacity, and the logo's position and size, stay for the
 * next image.
 */
export const IMAGE_SETTINGS: Record<string, readonly string[]> = {
  backgroundImage: ["backgroundPosition"],
  logoImage: [],
  photoImage: [],
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
export const POSITION_KEYS = [
  "contentPosition",
  "backgroundPosition",
  "logoPosition",
  "creditPosition",
] as const;

function isNumberFrom(value: unknown, min = -Infinity, max = Infinity): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

/** True when `value` is one the field's control could have set. */
function fitsField(field: EditorFieldSchema, value: unknown): boolean {
  switch (field.type) {
    case "toggle":
      return typeof value === "boolean";
    case "range":
      return isNumberFrom(value, field.min, field.max);
    case "colorPicker":
      return isQuoteColor(value);
    case "repoMultiSelect":
      return typeof value === "string" && isRepoSelection(value);
    case "iconPicker":
      return typeof value === "string" && isIconSelection(value);
    case "feedLink":
      return typeof value === "string" && (value === "" || isFeedLink(value));
    case "certificationList":
      return typeof value === "string" && isCertifications(value);
    case "usagePaste":
      return typeof value === "string" && (value === "" || isAiUsage(value));
    // removeUnsavableImages checks these.
    case "backgroundPicker":
    case "logoPicker":
    case "photoPicker":
      return true;
    default:
      return (
        typeof value === "string" &&
        (!field.options || field.options.some((option) => option.value === value)) &&
        (field.maxLength === undefined || value.length <= field.maxLength) &&
        (!field.format || field.format(value) === value)
      );
  }
}

/**
 * Applies saved settings over the template defaults. Saved values come from the browser and can be
 * out of date. A value the template doesn't offer falls back to the default.
 */
export function applySavedSettings(
  prev: BannerSettings,
  templateId: TemplateId,
  saved: Record<string, unknown> | null,
  username: string | null,
): StudioSettings {
  if (!saved && !username) return prev;
  const defaults: Readonly<Record<string, unknown>> = prev;
  const merged: Record<string, unknown> = { ...prev, ...saved };
  merged.size = normalizeBannerSize(merged.size, prev.size);
  for (const field of templateRegistry[templateId].schema) {
    if (!fitsField(field, merged[field.key])) merged[field.key] = defaults[field.key];
  }
  if (!BANNER_PLATFORMS.some((platform) => platform.id === merged.platform)) delete merged.platform;
  if (!isNumberFrom(merged.backgroundZoom, MIN_BACKGROUND_ZOOM, MAX_BACKGROUND_ZOOM)) {
    delete merged.backgroundZoom;
  }
  if (!isNumberFrom(merged.backgroundOpacity, 0, 100)) delete merged.backgroundOpacity;
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
    merged.themeId = oneOfOr(GRID_COLOR_IDS, merged.themeId, prev.themeId);
  }
  // The year's options depend on the account's age, so the field has none to check against.
  if ("year" in prev && !(typeof merged.year === "string" && isContributionYear(merged.year))) {
    merged.year = prev.year;
  }
  // Every setting is checked above, so they fit the template's settings type.
  return clampSelectedRepos(merged as StudioSettings);
}

/**
 * Caps the repos banner's selection at MAX_REPOS in Selected mode. Pinned mode leaves the selection
 * alone so it's still there when the user switches back.
 */
export function clampSelectedRepos<S extends BannerSettings>(state: S): S {
  if (!("selectedRepos" in state) || state.mode !== "selected") return state;
  const parts = parseRepoSelection(state.selectedRepos);
  if (parts.length <= MAX_REPOS) return state;
  return { ...state, selectedRepos: parts.slice(0, MAX_REPOS).join(", ") };
}
