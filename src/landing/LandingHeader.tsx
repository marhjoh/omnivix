"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Coffee } from "lucide-react";
import { SITE_LINKS } from "@/src/lib/site-links";
import { ThemeToggle } from "@/src/theme/ThemeToggle";
import { ThemedIcon, ThemedLogo } from "@/src/theme/ThemedBrand";
import styles from "@/src/landing/landing.module.css";
import { HoverHighlightGroup, HoverHighlightItem } from "@/src/ui/HoverHighlight";
import { highlightItemClass } from "@/src/ui/highlightClasses";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const NAV_LINKS = [
  { id: "coffee", href: SITE_LINKS.buyMeACoffee, label: "Buy me a coffee", icon: <Coffee className="h-[18px] w-[18px] shrink-0" aria-hidden /> },
  { id: "github", href: SITE_LINKS.repo, label: "GitHub", icon: <GithubIcon className="h-[18px] w-[18px] shrink-0" /> },
] as const;

/**
 * Full-width bar at the top of the page; once scrolled it eases into a floating frosted-glass pill
 * (CSS transitions on `data-scrolled`, see landing.module.css). The header keeps a fixed height,
 * so the page never shifts while it animates. A highlight slides between the hovered/focused options.
 * Labelled links use 9px side padding (the space around an 18px icon in a 36px square), so the
 * visible gaps between options are even at every width.
 */
export function LandingHeader() {
  const scrolled = useSyncExternalStore(subscribeScroll, () => window.scrollY > 24, () => false);

  return (
    <header className={styles.siteHeader} data-scrolled={scrolled}>
      <div className={styles.navBar}>
        <Link href="/" className="shrink-0 transition-opacity hover:opacity-85" aria-label="Omnivix home">
          {/* Below 300px the wordmark would push the nav off screen; show the app icon instead. */}
          <span className="hidden min-[300px]:contents">
            <ThemedLogo className="h-8 w-auto sm:h-9" />
          </span>
          <span className="contents min-[300px]:hidden">
            <ThemedIcon className="h-8 w-8" size={32} />
          </span>
        </Link>
        <HoverHighlightGroup as="nav" layoutId="landing-nav-highlight" className="flex items-center gap-1.5" aria-label="Site">
          {NAV_LINKS.map((link) => (
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
      </div>
    </header>
  );
}
