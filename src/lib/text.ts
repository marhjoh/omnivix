/** "a, b or c" (or "a, b and c"); a single item as is. */
export function listText(items: readonly string[], conjunction: "or" | "and" = "or"): string {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${conjunction} ${items.at(-1)}`;
}
