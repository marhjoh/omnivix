// Layout values for code outside CSS. studio.module.css repeats them because media queries can't
// use CSS variables. Keep the two in sync.

/** Phones get the settings as a drawer over the preview instead of a sidebar beside it. */
export const PHONE_QUERY = "(max-width: 767px)";

/** The settings sidebar's width on desktop (`--sidebar-width`). */
const SIDEBAR_WIDTH_PX = 300;

/** `sizes` for preview images: the full width on phones, and the width beside the sidebar. */
export const PREVIEW_PHOTO_SIZES = `${PHONE_QUERY} 100vw, calc(100vw - ${SIDEBAR_WIDTH_PX}px)`;
