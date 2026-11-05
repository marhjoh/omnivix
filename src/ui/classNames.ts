// Not a client module, so server components like the footer can import these.

/** The header buttons' focus ring. */
export const highlightFocusClass =
  "focus-visible:outline-1 focus-visible:outline-accent focus-visible:ring-[3px] focus-visible:ring-accent/15";

/**
 * Round icon or link button in the site and studio headers. It's transparent so the sliding
 * HoverHighlightItem behind it shows as the hover state.
 */
export const highlightItemBaseClass = `relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-colors ${highlightFocusClass}`;

/** Muted text. For an accent color, use highlightItemBaseClass with your own text color. */
export const highlightItemClass = `${highlightItemBaseClass} text-muted hover:text-text`;

/** A link inside running text: accent colored, underlined on hover, with a focus ring. */
export const textLinkClass =
  "rounded-sm text-accent-hover underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-hidden";
