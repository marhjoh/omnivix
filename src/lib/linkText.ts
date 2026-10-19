/** Longest address shown in full; longer ones would take a whole line of text. */
const MAX_LINK_TEXT_LENGTH = 40;

/** How to show a URL as link text: without https://, or only its domain when it's long. */
export function linkText(url: string): string {
  const text = url.replace(/^https:\/\//, "");
  return text.length > MAX_LINK_TEXT_LENGTH ? new URL(url).hostname : text;
}
