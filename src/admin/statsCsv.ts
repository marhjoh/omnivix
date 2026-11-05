import type { DailyStats } from "@/src/stats/stats";

/**
 * One row per day and one column per counter, for a spreadsheet. Columns are sorted by name, so
 * each series and its values sit together.
 */
export function statsCsv(stats: DailyStats[]): string {
  const fields = [...new Set(stats.flatMap(({ counts }) => Object.keys(counts)))].sort();
  const rows = [
    ["day", ...fields],
    ...stats.map(({ day, counts }) => [day, ...fields.map((field) => String(counts[field] ?? 0))]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/**
 * Quotes cells that need it. Failure messages and sources come from outside, so a leading `=`, `+`,
 * `-` or `@` gets a `'`, or spreadsheets would run it as a formula
 * (https://owasp.org/www-community/attacks/CSV_Injection).
 */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}
