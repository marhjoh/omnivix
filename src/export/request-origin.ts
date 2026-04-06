import type { NextRequest } from "next/server";

/**
 * Origin the browser used to call the app. Prefer this over `request.nextUrl.origin` for
 * serverless: some platforms surface an internal host there, and Playwright must open the same
 * public URL users use (correct deployment, cookies, Vercel auth bypass rules).
 */
export function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host =
    forwardedHost?.split(",")[0]?.trim() || request.headers.get("host")?.trim();

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto =
    forwardedProto?.split(",")[0]?.trim() ||
    (process.env.VERCEL ? "https" : request.nextUrl.protocol.replace(":", "") || "http");

  if (host) {
    return `${proto}://${host}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return request.nextUrl.origin;
}
