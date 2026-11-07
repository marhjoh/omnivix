"use client";

// Safari, and every browser on iPhone and iPad, restores the scroll position after a reload only
// once the page has loaded, images included (https://bugs.webkit.org/show_bug.cgi?id=250814). Until
// then the page shows its top. This scrolls back as soon as the page is parsed. Back and Forward
// keep the browser's own restoration.
const SCROLL_RESTORE_SCRIPT = `(() => {
  const key = "omnivix-landing-scroll";
  try {
    addEventListener("pagehide", () => {
      if (location.pathname === "/") sessionStorage.setItem(key, String(scrollY));
    });
    const y = Number(sessionStorage.getItem(key));
    if (performance.getEntriesByType("navigation")[0]?.type !== "reload" || !y) return;
    history.scrollRestoration = "manual";
    scrollTo(0, y);
    // Falls short when the page isn't fully laid out yet.
    addEventListener("DOMContentLoaded", () => {
      if (scrollY < y) scrollTo(0, y);
    });
    // Not in the load handler itself. WebKit reads the setting right after those run.
    addEventListener("load", () => setTimeout(() => (history.scrollRestoration = "auto")));
  } catch {}
})();`;

/**
 * Goes after the landing page's content, which must be laid out to scroll to. Like ThemeScript, it
 * only runs from the server HTML.
 */
export function ScrollRestoreScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: SCROLL_RESTORE_SCRIPT }}
    />
  );
}
