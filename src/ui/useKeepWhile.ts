import { useState } from "react";

/**
 * While `waiting`, returns the value from before the wait started. Memoize `value`, since a new
 * identity counts as a change.
 */
export function useKeepWhile<T>(value: T, waiting: boolean): T {
  const [kept, setKept] = useState(value);
  if (!waiting && kept !== value) setKept(value);
  return waiting ? kept : value;
}
