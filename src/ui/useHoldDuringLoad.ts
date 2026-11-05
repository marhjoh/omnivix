import { useEffect, useState } from "react";
import { PENDING_DELAY_MS, PENDING_MIN_SHOW_MS } from "@/src/ui/useDelayedFlag";

type Phase = "idle" | "holding" | "showing";

/**
 * While `loading`, keeps returning the value from before the load for up to `PENDING_DELAY_MS`.
 * A quick load then goes straight from the old preview to the new one, with no loading screen.
 * A slower load shows the loading screen after the delay and keeps it for at least
 * `PENDING_MIN_SHOW_MS`, so it doesn't blink.
 *
 * Only values that `canHold` accepts are held. Holding an error would just show it for longer.
 * Memoize `value`, since a new identity counts as a change. A React transition can't do a delay or
 * a minimum show time, hence the timers.
 */
export function useHoldDuringLoad<T>(
  value: T,
  loading: boolean,
  canHold: (settled: T) => boolean,
): T {
  /** The last value from outside a load. */
  const [settled, setSettled] = useState(value);
  /** The last value during a load, kept on screen after the load until the minimum is up. */
  const [loadingValue, setLoadingValue] = useState(value);
  const [phase, setPhase] = useState<Phase>("idle");
  const [minShown, setMinShown] = useState(false);

  if (loading && phase === "idle") {
    setPhase(canHold(settled) ? "holding" : "showing");
    setMinShown(false);
  }
  if (!loading && (phase === "holding" || (phase === "showing" && minShown))) setPhase("idle");
  if (!loading && phase === "idle" && settled !== value) setSettled(value);
  if (loading && phase === "showing" && loadingValue !== value) setLoadingValue(value);

  useEffect(() => {
    if (phase !== "holding") return;
    const timer = setTimeout(() => {
      setPhase("showing");
      setMinShown(false);
    }, PENDING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "showing") return;
    const timer = setTimeout(() => setMinShown(true), PENDING_MIN_SHOW_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === "holding") return settled;
  if (phase === "showing") return loading ? value : loadingValue;
  return value;
}
