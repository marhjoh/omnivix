"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
import { SITE_NAV_LINKS } from "@/src/landing/siteNavLinks";
import { ThemeToggle } from "@/src/theme/ThemeToggle";
import { ThemedIcon, ThemedLogo } from "@/src/theme/ThemedBrand";
import styles from "@/src/landing/landing.module.css";
import { HoverHighlightGroup, HoverHighlightItem } from "@/src/ui/HoverHighlight";
import { highlightItemClass } from "@/src/ui/classNames";

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

/** The morph between the bar and the pill. */
const MORPH = { duration: 0.5, ease: [0.22, 1, 0.36, 1] } as const;

/** Half the pill's height (3.25rem), for round ends. */
const PILL_RADIUS = 26;

/**
 * A full-width bar at the top that turns into a floating glass pill once you scroll. CSS sets both
 * layouts (see `data-scrolled` in landing.module.css). Motion animates between them with
 * transforms, which keeps the corners, logo and links from stretching. The header has a fixed
 * height, so the page never shifts. Labeled links have 9px side padding, the same space an 18px
 * icon has in its 36px square, so the gaps between items look even.
 */
export function LandingHeader() {
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 24,
    () => false,
  );

  return (
    <header className={styles.siteHeader} data-scrolled={scrolled}>
      <MotionConfig reducedMotion="user" transition={{ layout: MORPH, borderRadius: MORPH }}>
        <motion.div
          layout
          initial={false}
          animate={{ borderRadius: scrolled ? PILL_RADIUS : 0 }}
          className={styles.navBar}
        >
          <span className={styles.navGlass} aria-hidden />
          <motion.div layout className="relative shrink-0">
            <Link
              href="/"
              className="shrink-0 transition-opacity duration-(--hover-fade) hover:opacity-85"
              aria-label="Omnivix home"
            >
              {/* Below 300px the wordmark would push the nav off screen, so show the app icon. */}
              <span className="hidden min-[300px]:contents">
                <ThemedLogo className="h-8 w-auto sm:h-9" />
              </span>
              <span className="contents min-[300px]:hidden">
                <ThemedIcon className="h-8 w-8" size={32} />
              </span>
            </Link>
          </motion.div>
          <motion.div layout className="relative">
            <HoverHighlightGroup
              as="nav"
              layoutId="landing-nav-highlight"
              className="flex items-center gap-1.5"
              aria-label="Header"
            >
              {SITE_NAV_LINKS.map((link) => (
                <HoverHighlightItem key={link.id} id={link.id}>
                  <a
                    href={link.href}
                    aria-label={link.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${highlightItemClass} sm:w-auto sm:px-[9px]`}
                  >
                    {link.icon}
                    <span className="hidden sm:inline">{link.label}</span>
                  </a>
                </HoverHighlightItem>
              ))}
              <HoverHighlightItem id="theme">
                <ThemeToggle className={highlightItemClass} />
              </HoverHighlightItem>
            </HoverHighlightGroup>
          </motion.div>
        </motion.div>
      </MotionConfig>
    </header>
  );
}
