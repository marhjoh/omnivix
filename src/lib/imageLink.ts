/** An http(s):// image link (as opposed to a preset path or an uploaded data URL). */
export function isHttpImageUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}
