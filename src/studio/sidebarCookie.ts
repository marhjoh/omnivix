import { setCookieClient } from "@/src/studio/studioCookies";

/** Desktop sidebar collapse, stored in a cookie so the server renders it correctly (no slide on load). */
export const SIDEBAR_COOKIE_NAME = "omnivix-sidebar";

export function parseSidebarCollapsedCookie(value: string | undefined): boolean {
  return value === "collapsed";
}

/** Client-only: persist for the next full page request / SSR. */
export function setSidebarCollapsedCookieClient(collapsed: boolean): void {
  setCookieClient(SIDEBAR_COOKIE_NAME, collapsed ? "collapsed" : "expanded");
}
