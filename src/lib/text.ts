/** "a, b or c" (or "a, b and c"); a single item as is. */
export function listText(items: readonly string[], conjunction: "or" | "and" = "or"): string {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${conjunction} ${items.at(-1)}`;
}

/** `text` cut to `maxChars` with "…" in the middle, keeping its start and end. */
export function truncateMiddle(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const keep = maxChars - 3;
  return `${text.slice(0, Math.ceil(keep / 2))}…${text.slice(-Math.floor(keep / 2))}`;
}

/** Longest address shown in full; longer ones would take a whole line of text. */
const MAX_LINK_TEXT_LENGTH = 40;

/** How to show a URL as link text: without https://, or only its domain when it's long. */
export function linkText(url: string): string {
  const text = url.replace(/^https:\/\//, "");
  return text.length > MAX_LINK_TEXT_LENGTH ? new URL(url).hostname : text;
}
