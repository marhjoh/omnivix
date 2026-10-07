import { OG_CONTENT_TYPE, OG_SIZE, renderSiteOgImage } from "@/src/og/ogImage";
import { SITE_NAME, SITE_TAGLINE } from "@/src/lib/site";

export const alt = `${SITE_NAME}: ${SITE_TAGLINE}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderSiteOgImage();
}
