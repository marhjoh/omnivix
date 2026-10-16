/** An http(s):// image link (as opposed to a preset path or an uploaded data URL). */
export function isHttpImageUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/** An http:// image link: the export only loads https links, so it can't be used. */
export function isInsecureImageLink(value: unknown): boolean {
  return typeof value === "string" && /^http:\/\//i.test(value.trim());
}
