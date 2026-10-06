// Plain module (not "use client"), so server components such as the footer can import these strings.

/**
 * Rounded icon/link button used in the site and studio headers. Transparent, so the sliding
 * highlight behind it (HoverHighlightItem) is the hover state; 36px tall with 18px icons.
 */
export const highlightItemBaseClass =
  "relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40";

/** Default (muted) colouring; use highlightItemBaseClass with your own text colour for accents. */
export const highlightItemClass = `${highlightItemBaseClass} text-muted hover:text-text`;
