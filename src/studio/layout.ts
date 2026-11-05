// The studio's layout, for code that needs it outside CSS. studio.module.css repeats these values
// (media queries can't use variables); keep them in sync.

/** Phones get the settings as a drawer over the preview instead of a sidebar beside it. */
export const PHONE_QUERY = "(max-width: 767px)";

/** The settings sidebar's width on desktop (`--sidebar-width`). */
const SIDEBAR_WIDTH_PX = 300;

/** The preview's width in the layout, for `sizes`: the whole screen on phones, beside the sidebar. */
export const PREVIEW_PHOTO_SIZES = `${PHONE_QUERY} 100vw, calc(100vw - ${SIDEBAR_WIDTH_PX}px)`;
