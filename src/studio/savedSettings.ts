import { MAX_REPOS, parseRepoSelection } from "@/src/lib/repoSelection";
import { normalizeBannerSize } from "@/src/lib/sizes";
import { templateRegistry } from "@/src/templates/registry";
import type { BannerSize, TemplateId } from "@/src/types/template";
import { THEME_PRESETS } from "@/src/types/theme";

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
