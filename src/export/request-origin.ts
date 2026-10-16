import type { NextRequest } from "next/server";

/**
 * Origin Playwright opens the render page on. On Vercel, the forwarded headers are set by the
 * platform and name the public URL users use (right deployment, cookies, auth bypass rules);
 * `nextUrl` can be an internal host there. Elsewhere those headers could come from the client, so
 * the server's own origin is used.
 */
export function getPublicOrigin(request: NextRequest): string {
  if (!process.env.VERCEL) return request.nextUrl.origin;
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (host) return `https://${host}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return request.nextUrl.origin;
}
