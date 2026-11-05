import { useEffect, useState } from "react";
import { PENDING_DELAY_MS, PENDING_MIN_SHOW_MS } from "@/src/ui/useDelayedFlag";

/**
 * Status text while an export runs, and when each step starts. Exports take about 6–10 s on a warm
 * server and about 14 s on a cold start. The first step's delay, like the studio's loading screen,
 * keeps fast exports from flashing it.
 */
const EXPORT_STEPS = [
  { afterMs: PENDING_DELAY_MS, text: "Rendering your banner…" },
  { afterMs: 5000, text: "Almost there…" },
  { afterMs: 12000, text: "Taking a bit longer than usual…" },
] as const;

/**
 * The status text while `running`, or null. Nothing shows for the first `PENDING_DELAY_MS`, then
 * the text changes with the elapsed time. Once shown, it stays for at least `PENDING_MIN_SHOW_MS`.
 */
export function useExportProgress(running: boolean): string | null {
  const [shown, setShown] = useState<{ step: number; since: number } | null>(null);

  useEffect(() => {
    if (!running) return;
    const timers = EXPORT_STEPS.map(({ afterMs }, step) =>
      setTimeout(() => setShown({ step, since: Date.now() }), afterMs),
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
