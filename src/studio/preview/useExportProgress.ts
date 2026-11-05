import { useEffect, useState } from "react";
import { PENDING_DELAY_MS, PENDING_MIN_SHOW_MS } from "@/src/studio/useDelayedFlag";

/**
 * What the preview says while an export runs, from when each step starts. Exports take about
 * 6–10 s once the server is warm and about 14 s on a cold start; the first step's delay (like the
 * studio's loading screen) keeps quick exports from flashing it.
 */
const EXPORT_STEPS = [
  { afterMs: PENDING_DELAY_MS, text: "Rendering your banner…" },
  { afterMs: 5000, text: "Almost there…" },
  { afterMs: 12000, text: "Taking a bit longer than usual…" },
] as const;

/**
 * The status text to show while `running`, or null: none for the first `PENDING_DELAY_MS`, then a
 * text that changes with the elapsed time. Once shown, it stays at least `PENDING_MIN_SHOW_MS`.
 * Explicit state: a transition can't express the delays.
 */
export function useExportProgress(running: boolean): string | null {
  const [shown, setShown] = useState<{ step: number; since: number } | null>(null);

  useEffect(() => {
    if (!running) return;
    const timers = EXPORT_STEPS.map(({ afterMs }, step) =>
      setTimeout(
        () =>
          setShown((previous) => ({
            step,
            since: step === 0 || !previous ? Date.now() : previous.since,
          })),
        afterMs,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [running]);

  useEffect(() => {
    if (running || !shown) return;
    const timer = setTimeout(
      () => setShown(null),
      Math.max(0, shown.since + PENDING_MIN_SHOW_MS - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [running, shown]);

  return shown ? EXPORT_STEPS[shown.step].text : null;
}
