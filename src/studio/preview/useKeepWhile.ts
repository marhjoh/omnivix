import { useState } from "react";

/**
 * While `waiting`, keeps returning the value from before the wait started; otherwise the current
 * one. `value` must keep its identity between renders unless it changes (memoize it).
 */
export function useKeepWhile<T>(value: T, waiting: boolean): T {
  const [kept, setKept] = useState(value);
  if (!waiting && kept !== value) setKept(value);
  return waiting ? kept : value;
}
