// Settings live in cookies so the server renders them from the first paint (no defaults that
// switch to the remembered values after loading).

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

/** Browsers drop cookies over 4 KB; settings that don't fit just aren't remembered. */
const MAX_COOKIE_VALUE_LENGTH = 3800;

/** A year, for every page. `Secure` is added on https, where SameSite cookies need it. */
export const COOKIE_ATTRIBUTES = `Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`;

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

/** Client-only: saves a cookie for the next page request. */
export function setCookieClient(name: string, value: string): void {
  if (typeof document === "undefined" || !fitsInCookie(value)) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; ${COOKIE_ATTRIBUTES}${secure}`;
}
