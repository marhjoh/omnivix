const DAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Two days (YYYY-MM-DD) as "Oct 5 – Nov 8, 2026". The first year shows only when it differs.
 *
 * It joins two formatted dates instead of using `Intl.DateTimeFormat.formatRange`. That one takes
 * its spacing from the runtime's locale data, which differs between Node and browsers, so a range
 * rendered on the server wouldn't match the one in the browser.
 */
export function formatDayRange(first: string, last: string): string {
  // Date-only ISO strings parse as UTC.
  const from = new Date(first);
  const to = new Date(last);
  if (first === last) return DATE.format(to);
  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  return `${(sameYear ? DAY : DATE).format(from)} – ${DATE.format(to)}`;
}
