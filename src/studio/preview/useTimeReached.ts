import { useEffect, useState } from "react";

/** Whether `at` has passed (true without one); re-renders when it does. */
export function useTimeReached(at: Date | null | undefined): boolean {
  const [now, setNow] = useState(() => Date.now());
  const target = at?.getTime();
  useEffect(() => {
    if (target === undefined) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, target - Date.now()));
    return () => clearTimeout(timer);
  }, [target]);
  return target === undefined || now >= target;
}
