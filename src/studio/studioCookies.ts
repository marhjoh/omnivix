/** The studio's cookies (see src/lib/cookies.ts). Values come from the browser, so they're checked. */

import { isGithubUsername } from "@/src/lib/githubUsername";

export const USERNAME_COOKIE = "omnivix-username";

/** One cookie per template, holding that template's settings as JSON. */
export function settingsCookieName(templateId: string): string {
  return `omnivix-settings-${templateId}`;
}

export function parseUsernameCookie(value: string | undefined): string | null {
  if (value === undefined) return null;
  try {
    const username = decodeURIComponent(value);
    return isGithubUsername(username) ? username : null;
  } catch {
    return null;
  }
}

export function parseSettingsCookie(value: string | undefined): Record<string, unknown> | null {
  if (value === undefined) return null;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
