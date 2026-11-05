import { useEffect, useRef } from "react";

/**
 * Calls `callback` after `delayMs` with no new `schedule`. `flush` runs a pending call now and
 * `cancel` drops it. Nothing runs after unmount.
 */
export function useDebouncedCallback<T>(callback: (value: T) => void, delayMs: number) {
  const pending = useRef<{ timer: ReturnType<typeof setTimeout>; value: T } | null>(null);
  const latest = useRef(callback);
  useEffect(() => {
    latest.current = callback;
  });
  useEffect(() => () => clearTimeout(pending.current?.timer), []);

  const cancel = () => {
    clearTimeout(pending.current?.timer);
    pending.current = null;
  };
  const run = (value: T) => {
    pending.current = null;
    latest.current(value);
  };
  return {
    schedule(value: T) {
      cancel();
      pending.current = { timer: setTimeout(() => run(value), delayMs), value };
    },
    flush() {
      if (!pending.current) return;
      const { value } = pending.current;
      cancel();
      run(value);
    },
    cancel,
  };
}
