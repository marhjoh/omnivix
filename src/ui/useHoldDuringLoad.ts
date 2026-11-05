import { useEffect, useState } from "react";
import { PENDING_DELAY_MS, PENDING_MIN_SHOW_MS } from "@/src/ui/useDelayedFlag";

type Phase = "idle" | "holding" | "showing";

/**
 * While `loading`, keeps returning the value from before the load started, for up to
 * `PENDING_DELAY_MS`.
 * Quick loads then go straight from the old preview to the new one, without a loading screen
 * flashing in between; slower loads show it after the delay, and keep it for at least
 * `PENDING_MIN_SHOW_MS` so it never just blinks. Only values `canHold` accepts are held (holding an error
 * would show it longer for nothing). `value` must keep its identity between renders unless it
 * changes (memoize it). Explicit state: a transition can't express the delay or minimum show time.
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
