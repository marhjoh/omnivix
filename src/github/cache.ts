const ttlCache = new Map<string, { expiry: number; value: unknown }>();

export function readCache<T>(key: string): T | null {
  const hit = ttlCache.get(key);
  if (!hit) {
    return null;
  }
  if (hit.expiry < Date.now()) {
    ttlCache.delete(key);
    return null;
  }
  return hit.value as T;
}

export function writeCache<T>(key: string, value: T, ttlMs = 1000 * 60 * 5): T {
  ttlCache.set(key, { expiry: Date.now() + ttlMs, value });
  return value;
}
