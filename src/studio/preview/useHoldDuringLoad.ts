import { useEffect, useState } from "react";

/**
 * While `loading`, keeps returning the value from before the load started, for up to `delayMs`.
 * Quick loads then go straight from the old preview to the new one, without a loading screen
 * flashing in between; slower loads show it after the delay. `value` must keep its identity
 * between renders unless it changes (memoize it).
 */
export function useHoldDuringLoad<T>(value: T, loading: boolean, delayMs: number): T {
  const [settled, setSettled] = useState(value);
  const [expired, setExpired] = useState(false);

  // Remember each value that isn't loading; once loading ends, the hold is over.
  if (!loading && settled !== value) setSettled(value);
  if (!loading && expired) setExpired(false);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setExpired(true), delayMs);
    return () => clearTimeout(timer);
  }, [loading, delayMs]);

  return loading && !expired ? settled : value;
}
