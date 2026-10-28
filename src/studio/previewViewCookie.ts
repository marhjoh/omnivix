import { BANNER_VIEWS, type BannerView } from "@/src/lib/sizes";

/** The preview's view (Phone, Desktop or TV), stored in a cookie so the server renders it. */
export const PREVIEW_VIEW_COOKIE_NAME = "omnivix-preview-view";

/** Phones by default: most viewers see that, and it's the part the content fits. */
export function parsePreviewViewCookie(value: string | undefined): BannerView {
  return BANNER_VIEWS.find((view) => view === value) ?? "phone";
}
