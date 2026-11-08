import { MINUTE_MS } from "@/src/github/cacheTimes";

/** How long feeds are cached, on the server and the CDN. Posts come out rarely. */
export const FEED_TTL_MS = 30 * MINUTE_MS;
