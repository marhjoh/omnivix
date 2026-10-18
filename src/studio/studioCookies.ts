/**
 * Studio settings live in cookies so the server renders them from the first paint (no defaults
 * that switch to the remembered values after loading). Values come from the browser, so they're
 * checked again where they're used.
 */

import { isGithubUsername } from "@/src/lib/githubUsername";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;
/** Browsers drop cookies over 4 KB; settings that don't fit just aren't remembered. */
const MAX_COOKIE_VALUE_LENGTH = 3800;

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

/** Client-only: a cookie's raw value, or undefined. */
export function readCookieClient(name: string): string | undefined {
  const prefix = `${name}=`;
  return document.cookie
    .split("; ")
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

/** Whether a value fits in a cookie once encoded; setCookieClient skips values that don't. */
export function fitsInCookie(value: string): boolean {
  return encodeURIComponent(value).length <= MAX_COOKIE_VALUE_LENGTH;
}

/** Client-only: saves a cookie for a year, for the next page request. */
export function setCookieClient(name: string, value: string): void {
  if (typeof document === "undefined") return;
  if (!fitsInCookie(value)) return;
  const encoded = encodeURIComponent(value);
  const secure = window.location.protocol === "https:";
  document.cookie = `${name}=${encoded}; Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure ? "; Secure" : ""}`;
}
