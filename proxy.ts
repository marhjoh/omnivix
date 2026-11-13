import type { NextRequest } from "next/server";
import { checkAdminAuth } from "@/src/admin/adminAuth";
import { countLlmsRead } from "@/src/stats/llmsRead";
import { countPageView } from "@/src/stats/pageView";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin")) return checkAdminAuth(request) ?? undefined;
  if (pathname === "/llms.txt") countLlmsRead(request);
  else countPageView(request);
}

export const config = {
  // /llms.txt is static, so the proxy is the only code that runs when the CDN serves it.
  matcher: ["/", "/studio/:path*", "/admin/:path*", "/llms.txt"],
};
