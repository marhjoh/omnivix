"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Coffee } from "lucide-react";
import { SITE_LINKS } from "@/src/lib/site-links";
import { GithubIcon } from "@/src/ui/GithubIcon";
import { ThemeToggle } from "@/src/theme/ThemeToggle";
import { ThemedIcon, ThemedLogo } from "@/src/theme/ThemedBrand";
import styles from "@/src/landing/landing.module.css";
import { HoverHighlightGroup, HoverHighlightItem } from "@/src/ui/HoverHighlight";
import { highlightItemClass } from "@/src/ui/highlightClasses";

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const NAV_LINKS = [
  {
    id: "coffee",
    href: SITE_LINKS.buyMeACoffee,
    label: "Buy me a coffee",
    icon: <Coffee className="h-[18px] w-[18px] shrink-0" aria-hidden />,
  },
  {
    id: "github",
    href: SITE_LINKS.repo,
    label: "GitHub",
    icon: <GithubIcon />,
  },
] as const;

/**
 * Full-width bar at the top of the page; once scrolled it eases into a floating frosted-glass pill
 * (CSS transitions on `data-scrolled`, see landing.module.css). The header keeps a fixed height,
 * so the page never shifts while it animates. A highlight slides between the hovered/focused options.
 * Labeled links use 9px side padding (the space around an 18px icon in a 36px square), so the
 * visible gaps between options are even at every width.
 */
export function LandingHeader() {
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 24,
    () => false,
  );

  return (
    <header className={styles.siteHeader} data-scrolled={scrolled}>
      <div className={styles.navBar}>
        <Link
          href="/"
          className="shrink-0 transition-opacity hover:opacity-85"
          aria-label="Omnivix home"
        >
          {/* Below 300px the wordmark would push the nav off screen; show the app icon instead. */}
          <span className="hidden min-[300px]:contents">
            <ThemedLogo className="h-8 w-auto sm:h-9" />
          </span>
          <span className="contents min-[300px]:hidden">
            <ThemedIcon className="h-8 w-8" size={32} />
          </span>
        </Link>
        <HoverHighlightGroup
          as="nav"
          layoutId="landing-nav-highlight"
          className="flex items-center gap-1.5"
          aria-label="Site"
        >
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
