import packageJson from "@/package.json";
import { SITE_LINKS } from "@/src/lib/site-links";

/** Deployed version, bumped in package.json with each release. */
export const APP_VERSION = packageJson.version;

/** Release notes for the deployed version. */
export const APP_RELEASE_URL = `${SITE_LINKS.repo}/releases/tag/v${APP_VERSION}`;
