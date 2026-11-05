// Settings live in cookies so the server can render them on the first paint. Otherwise the page
// would show the defaults and then switch to the saved values.

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

/** Browsers drop cookies over 4 KB. Settings that don't fit just aren't remembered. */
const MAX_COOKIE_VALUE_LENGTH = 3800;

/** Kept for a year, for every page. `setCookieClient` adds `Secure` on https. */
export const COOKIE_ATTRIBUTES = `Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`;

/** Client only. Returns the value still URI-encoded, or undefined. */
export function readCookieClient(name: string): string | undefined {
  const prefix = `${name}=`;
  return document.cookie
    .split("; ")
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

/** Checks the encoded length. setCookieClient skips values that don't fit. */
export function fitsInCookie(value: string): boolean {
  return encodeURIComponent(value).length <= MAX_COOKIE_VALUE_LENGTH;
}

/** Client only. Saves a cookie so the next page request sends it. */
export function setCookieClient(name: string, value: string): void {
  if (typeof document === "undefined" || !fitsInCookie(value)) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; ${COOKIE_ATTRIBUTES}${secure}`;
}
