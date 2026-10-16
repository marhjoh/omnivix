import { useEffect, useState } from "react";

/** True once `on` has stayed true for `delayMs`; quick loads never turn it on. */
export function useDelayedFlag(on: boolean, delayMs: number): boolean {
  const [elapsed, setElapsed] = useState(false);
  if (!on && elapsed) setElapsed(false);

  useEffect(() => {
    if (!on) return;
    const timer = setTimeout(() => setElapsed(true), delayMs);
    return () => clearTimeout(timer);
  }, [on, delayMs]);

  return on && elapsed;
}
