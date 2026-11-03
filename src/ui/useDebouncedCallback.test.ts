import { describe, expect, it, vi } from "vitest";

// The hook's logic without React: refs are plain objects and effects run at once.
vi.mock("react", () => ({
  useRef: <T>(value: T) => ({ current: value }),
  useEffect: (effect: () => void) => effect(),
}));

const { useDebouncedCallback } = await import("./useDebouncedCallback");

describe("useDebouncedCallback", () => {
  it("calls once with the last value after the delay", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = useDebouncedCallback(callback, 100);
    debounced.schedule("a");
    debounced.schedule("b");
    vi.advanceTimersByTime(99);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledExactlyOnceWith("b");
    vi.useRealTimers();
  });

  it("flushes a pending call now, and cancels one", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = useDebouncedCallback(callback, 100);
    debounced.schedule("a");
    debounced.flush();
    expect(callback).toHaveBeenCalledExactlyOnceWith("a");
    debounced.flush();
    debounced.schedule("b");
    debounced.cancel();
    vi.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
