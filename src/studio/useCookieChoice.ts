import { useState } from "react";
import { readCookieClient, setCookieClient } from "@/src/lib/cookies";
import type { StudioCookie } from "@/src/studio/studioCookies";

/**
 * A choice remembered in a cookie. The server passes what it read as `initial`; the browser reads
 * the cookie again, because Next.js may reuse an earlier render on Back or Forward.
 */
export function useCookieChoice<T extends string | number>(cookie: StudioCookie<T>, initial: T) {
  const [value, setValue] = useState(() =>
    typeof document === "undefined" ? initial : cookie.parse(readCookieClient(cookie.name)),
  );
  const change = (next: T) => {
    setValue(next);
    setCookieClient(cookie.name, String(next));
  };
  return [value, change] as const;
}
