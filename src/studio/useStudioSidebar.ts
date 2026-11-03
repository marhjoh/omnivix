import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { setSidebarCollapsedCookieClient } from "@/src/studio/studioCookies";

/** A bit longer than the sidebar's 0.2s transition in studio.module.css. */
const SIDEBAR_ANIMATION_MS = 300;

/** Keep in sync with the drawer breakpoint in studio.module.css. */
const PHONE_QUERY = "(max-width: 767px)";

function subscribePhone(onChange: () => void) {
  const mq = window.matchMedia(PHONE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * The settings panel: a sidebar on desktop, whose collapse is remembered (cookie, read by the
 * page), and a drawer on phones, which starts closed.
 */
export function useStudioSidebar(initialCollapsed: boolean) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isPhone = useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );

  // Crossing the breakpoint keeps what the user sees: widening turns a closed drawer into a
  // collapsed sidebar (and an open one into an open sidebar); narrowing always closes the drawer,
  // so it never pops up over the preview by itself.
  const [prevIsPhone, setPrevIsPhone] = useState(isPhone);
  if (isPhone !== prevIsPhone) {
    setPrevIsPhone(isPhone);
    if (!isPhone) setSidebarCollapsed(!drawerOpen);
    setDrawerOpen(false);
  }

  // The cookie lets the server render the desktop sidebar in the right state on the next load.
  useEffect(() => {
    setSidebarCollapsedCookieClient(sidebarCollapsed);
  }, [sidebarCollapsed]);

  // The sidebar only animates for user actions (toggle, backdrop, Escape). Without this, crossing
  // the drawer breakpoint while resizing animates its width and the preview shrinks, then grows.
  const [sidebarAnimating, setSidebarAnimating] = useState(false);
  const animationTimer = useRef<number | undefined>(undefined);
  const animateSidebar = useCallback((change: () => void) => {
    setSidebarAnimating(true);
    change();
    window.clearTimeout(animationTimer.current);
    animationTimer.current = window.setTimeout(
      () => setSidebarAnimating(false),
      SIDEBAR_ANIMATION_MS,
    );
  }, []);
  useEffect(() => () => window.clearTimeout(animationTimer.current), []);

  const closeDrawer = useCallback(
    () => animateSidebar(() => setDrawerOpen(false)),
    [animateSidebar],
  );

  function toggleSidebar() {
    animateSidebar(() => {
      if (isPhone) {
        setDrawerOpen((open) => !open);
        return;
      }
      setSidebarCollapsed((collapsed) => !collapsed);
    });
  }

  /** Opens the settings (the drawer on phones) with the cursor in a setting's field. */
  const focusSetting = useCallback(
    (key: string) => {
      animateSidebar(() => (isPhone ? setDrawerOpen(true) : setSidebarCollapsed(false)));
      // The panel is visible from this render on, so its field can take focus next frame.
      requestAnimationFrame(() => document.getElementById(key)?.focus());
    },
    [animateSidebar, isPhone],
  );

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, closeDrawer]);

  return {
    isPhone,
    sidebarCollapsed,
    drawerOpen,
    sidebarAnimating,
    /** Whether the settings show: the drawer on phones, the sidebar on desktop. */
    sidebarExpanded: isPhone ? drawerOpen : !sidebarCollapsed,
    toggleSidebar,
    closeDrawer,
    focusSetting,
  };
}
