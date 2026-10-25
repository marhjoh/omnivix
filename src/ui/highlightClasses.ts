// Plain module (not "use client"), so server components such as the footer can import these strings.

/** The header buttons' focus ring. */
export const highlightFocusClass =
  "focus-visible:outline-1 focus-visible:outline-accent focus-visible:ring-[3px] focus-visible:ring-accent/15";

/**
 * Rounded icon/link button used in the site and studio headers. Transparent, so the sliding
 * highlight behind it (HoverHighlightItem) is the hover state; 36px tall with 18px icons.
 */
export const highlightItemBaseClass = `relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-colors ${highlightFocusClass}`;

/** Default (muted) coloring; use highlightItemBaseClass with your own text color for accents. */
export const highlightItemClass = `${highlightItemBaseClass} text-muted hover:text-text`;
