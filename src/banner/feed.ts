/** A post on the latest posts banner. */
export interface FeedPost {
  title: string;
  /** YYYY-MM-DD, or null when the feed doesn't date it. */
  date: string | null;
}

/** What `/api/feed` returns: the newest posts first. */
export interface Feed {
  posts: FeedPost[];
}

/** The API returns at most this many posts, and the banner shows up to this many. */
export const MAX_POSTS = 6;
export const MIN_POSTS = 1;
export const DEFAULT_POSTS = 3;

export const FEED_LINK_MAX_LENGTH = 500;

/** True for an https link that isn't too long. The server checks the rest when it fetches it. */
export function isFeedLink(value: string): boolean {
  if (value.length > FEED_LINK_MAX_LENGTH) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** The URL the studio loads a feed from, or null for none. */
export function feedApiUrl(link: string): string | null {
  return isFeedLink(link) ? `/api/feed?url=${encodeURIComponent(link)}` : null;
}

/** The first path segment, without slashes. */
function firstSegment(url: URL): string {
  return url.pathname.split("/").filter(Boolean)[0] ?? "";
}

/** A blog's front page, where a profile link points. */
function isRoot(url: URL): boolean {
  return url.pathname.replace(/\/+$/, "") === "";
}

/**
 * The feed link for what someone typed: a feed link, or a dev.to, Medium, Hashnode or Substack
 * profile link, whose feed is at a known address. A link without `https://` gets it.
 */
export function feedLinkFrom(
  input: string,
): { ok: true; link: string } | { ok: false; message: string } {
  const text = input.trim();
  if (/^http:\/\//i.test(text)) return { ok: false, message: "Feed links must use https://." };
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return { ok: false, message: "That isn't a link." };
  }
  if (url.protocol !== "https:" || !url.hostname.includes(".")) {
    return { ok: false, message: "That isn't a link." };
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const segment = firstSegment(url);
  let link = url.href;
  if (host === "dev.to" && segment && segment !== "feed") {
    link = `https://dev.to/feed/${segment}`;
  } else if (host === "medium.com" && segment.startsWith("@")) {
    link = `https://medium.com/feed/${segment}`;
  } else if (host.endsWith(".medium.com") && isRoot(url)) {
    link = `https://${host}/feed`;
  } else if (host.endsWith(".hashnode.dev") && isRoot(url)) {
    link = `https://${host}/rss.xml`;
  } else if (host.endsWith(".substack.com") && isRoot(url)) {
    link = `https://${host}/feed`;
  }
  if (link.length > FEED_LINK_MAX_LENGTH) return { ok: false, message: "That link is too long." };
  return { ok: true, link };
}
