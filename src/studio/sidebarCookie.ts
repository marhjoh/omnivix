/** Desktop sidebar collapse, stored in a cookie so the server renders it correctly (no slide on load). */
export const SIDEBAR_COOKIE_NAME = "omnivix-sidebar";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

export function parseSidebarCollapsedCookie(value: string | undefined): boolean {
  return value === "collapsed";
}

/** Client-only: persist for the next full page request / SSR. */
export function setSidebarCollapsedCookieClient(collapsed: boolean): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:";
  const tail = `Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure ? "; Secure" : ""}`;
  document.cookie = `${SIDEBAR_COOKIE_NAME}=${collapsed ? "collapsed" : "expanded"}; ${tail}`;
}
