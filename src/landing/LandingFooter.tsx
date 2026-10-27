import Link from "next/link";
import { Coffee } from "lucide-react";
import { APP_RELEASE_URL, APP_VERSION } from "@/src/lib/app-version";
import { SITE_LINKS } from "@/src/lib/site-links";
import { GithubIcon } from "@/src/ui/GithubIcon";
import { ThemedLogo } from "@/src/theme/ThemedBrand";
import { HoverHighlightGroup, HoverHighlightItem } from "@/src/ui/HoverHighlight";
import { highlightItemBaseClass } from "@/src/ui/highlightClasses";

/** Labeled footer links: brighter than the header's muted links, 9px side padding like it. */
const footerLinkClass = `${highlightItemBaseClass} w-auto px-[9px] text-text/90 hover:text-text`;

export function LandingFooter() {
  return (
    <footer className="border-t border-border/50 bg-surface/20 px-4 py-10 sm:py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between">
        <Link href="/" className="shrink-0 transition-opacity hover:opacity-85">
          <ThemedLogo className="h-8 w-auto sm:h-9" />
        </Link>
        {/* Same rounded links and sliding hover/focus highlight as the site header. */}
        <HoverHighlightGroup
          as="nav"
          layoutId="footer-highlight"
          className="flex max-w-2xl flex-wrap items-center justify-center gap-x-1.5 gap-y-2 text-sm text-muted sm:justify-end"
          aria-label="Credits, support, repository, and release notes"
        >
          <span className="flex items-center">
            <span className="pr-1">Maintained by</span>
            <HoverHighlightItem id="maintainer">
              <a
                href={SITE_LINKS.maintainerProfile}
                target="_blank"
                rel="noopener noreferrer"
                className={footerLinkClass}
              >
                @{SITE_LINKS.maintainerHandle}
              </a>
            </HoverHighlightItem>
          </span>
          <HoverHighlightItem id="coffee">
            <a
              href={SITE_LINKS.buyMeACoffee}
              target="_blank"
              rel="noopener noreferrer"
              className={footerLinkClass}
            >
              <Coffee className="h-[18px] w-[18px] shrink-0" aria-hidden />
              Buy me a coffee
            </a>
          </HoverHighlightItem>
          <HoverHighlightItem id="github">
            <a
              href={SITE_LINKS.repo}
              target="_blank"
              rel="noopener noreferrer"
              className={footerLinkClass}
            >
              <GithubIcon />
              GitHub
            </a>
          </HoverHighlightItem>
          <HoverHighlightItem id="version">
            <a
              href={APP_RELEASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${footerLinkClass} tabular-nums`}
              aria-label={`Release notes for v${APP_VERSION}`}
            >
              v{APP_VERSION}
            </a>
          </HoverHighlightItem>
        </HoverHighlightGroup>
      </div>
    </footer>
  );
}
