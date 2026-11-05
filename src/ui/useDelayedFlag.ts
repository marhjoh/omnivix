import { useEffect, useState } from "react";

/** Loads faster than this show no spinner, skeleton or loading screen at all. */
export const PENDING_DELAY_MS = 300;

/** Once shown, a pending state stays at least this long, so it doesn't just blink. */
export const PENDING_MIN_SHOW_MS = 400;

type Phase = "idle" | "waiting" | "shown";

/**
 * Turns true once `on` has been true for `PENDING_DELAY_MS`, then stays true for at least
 * `PENDING_MIN_SHOW_MS`. A React transition can't do a delay or a minimum show time, hence the
 * timers.
 */
export function useDelayedFlag(on: boolean): boolean {
  const [phase, setPhase] = useState<Phase>("idle");
  const [minShown, setMinShown] = useState(false);

  if (on && phase === "idle") setPhase("waiting");
  if (!on && (phase === "waiting" || (phase === "shown" && minShown))) setPhase("idle");

  useEffect(() => {
    if (phase !== "waiting") return;
    const timer = setTimeout(() => {
      setPhase("shown");
      setMinShown(false);
    }, PENDING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "shown") return;
    const timer = setTimeout(() => setMinShown(true), PENDING_MIN_SHOW_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  return phase === "shown";
}
