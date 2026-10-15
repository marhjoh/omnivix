/** Entries kept at most; the oldest are dropped first, so a long-lived server doesn't grow forever. */
const MAX_ENTRIES = 500;

const ttlCache = new Map<string, { expiry: number; value: unknown }>();
/** Requests still running, so identical concurrent requests share one GitHub call. */
const inFlight = new Map<string, Promise<unknown>>();

function read<T>(key: string): T | undefined {
  const hit = ttlCache.get(key);
  if (!hit) return undefined;
  if (hit.expiry < Date.now()) {
    ttlCache.delete(key);
    return undefined;
  }
  return hit.value as T;
}

function write(key: string, value: unknown, ttlMs: number) {
  ttlCache.delete(key);
  ttlCache.set(key, { expiry: Date.now() + ttlMs, value });
  // Maps keep insertion order, so the first keys are the oldest.
  for (const oldest of ttlCache.keys()) {
    if (ttlCache.size <= MAX_ENTRIES) break;
    ttlCache.delete(oldest);
  }
}

/** Returns the cached value for `key`, or runs `load` once (shared by concurrent callers) and caches it. */
export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = read<T>(key);
  if (hit !== undefined) return Promise.resolve(hit);
  const running = inFlight.get(key);
  if (running) return running as Promise<T>;
  const request = load()
    .then((value) => {
      write(key, value, ttlMs);
      return value;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}
