/** An http:// image link: the export only loads https links, so it can't be used. */
export function isInsecureImageLink(value: unknown): boolean {
  return typeof value === "string" && /^http:\/\//i.test(value.trim());
}
