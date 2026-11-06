import { timingSafeEqual } from "node:crypto";

/** Compares secrets in constant time. Only the length can leak. */
export function sameText(a: string, b: string): boolean {
  const given = Buffer.from(a);
  const expected = Buffer.from(b);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
