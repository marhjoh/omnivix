import { useEffect, useState } from "react";

/** Waits quicker than this show no pending state (spinner, skeleton, loading screen) at all. */
export const PENDING_DELAY_MS = 300;

/** Once shown, a pending state stays at least this long, so it doesn't just blink. */
export const PENDING_MIN_SHOW_MS = 400;

type Phase = "idle" | "waiting" | "shown";

/**
 * True once `on` has stayed true for `delayMs`, so quick loads never turn it on; once on, it stays
 * on for at least `minShowMs`, even if `on` turns false sooner. Explicit state: a transition can't
 * express the delay or the minimum show time.
 */
export function useDelayedFlag(
  on: boolean,
  delayMs = PENDING_DELAY_MS,
  minShowMs = PENDING_MIN_SHOW_MS,
): boolean {
  const [phase, setPhase] = useState<Phase>("idle");
  const [minShown, setMinShown] = useState(false);

  if (on && phase === "idle") setPhase("waiting");
  if (!on && (phase === "waiting" || (phase === "shown" && minShown))) setPhase("idle");

  useEffect(() => {
    if (phase !== "waiting") return;
    const timer = setTimeout(() => {
      setPhase("shown");
      setMinShown(false);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [phase, delayMs]);

  useEffect(() => {
    if (phase !== "shown") return;
    const timer = setTimeout(() => setMinShown(true), minShowMs);
    return () => clearTimeout(timer);
  }, [phase, minShowMs]);

  return phase === "shown";
}
