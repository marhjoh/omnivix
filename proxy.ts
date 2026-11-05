import type { NextRequest } from "next/server";
import { checkAdminAuth } from "@/src/admin/adminAuth";
import { countPageView } from "@/src/stats/pageView";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) return checkAdminAuth(request) ?? undefined;
  countPageView(request);
}

export const config = {
  matcher: ["/", "/studio/:path*", "/admin/:path*"],
};
