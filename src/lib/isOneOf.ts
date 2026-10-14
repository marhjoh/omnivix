/** Type guard for values read from untyped state, e.g. `isOneOf(BANNER_SIZE_KEYS, raw)`. */
export function isOneOf<T extends string>(values: readonly T[], raw: unknown): raw is T {
  return (values as readonly unknown[]).includes(raw);
}
