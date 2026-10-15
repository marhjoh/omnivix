/**
 * Studio settings live in cookies so the server renders them from the first paint (no defaults
 * that switch to the remembered values after loading). Values come from the browser, so they're
 * checked again where they're used.
 */

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;
/** Browsers drop cookies over 4 KB; settings that don't fit just aren't remembered. */
const MAX_COOKIE_VALUE_LENGTH = 3800;

/** GitHub's username rules (letters, digits, single hyphens, at most 39 characters). */
const GITHUB_USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export const USERNAME_COOKIE = "omnivix-username";

/** One cookie per template, holding that template's settings as JSON. */
export function settingsCookieName(templateId: string): string {
  return `omnivix-settings-${templateId}`;
}

export function parseUsernameCookie(value: string | undefined): string | null {
  if (value === undefined) return null;
  try {
    const username = decodeURIComponent(value);
    return GITHUB_USERNAME.test(username) ? username : null;
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

/** Client-only: saves a cookie for a year, for the next page request. */
export function setCookieClient(name: string, value: string): void {
  if (typeof document === "undefined") return;
  const encoded = encodeURIComponent(value);
  if (encoded.length > MAX_COOKIE_VALUE_LENGTH) return;
  const secure = window.location.protocol === "https:";
  document.cookie = `${name}=${encoded}; Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure ? "; Secure" : ""}`;
}
