import { adminPeriod } from "@/src/admin/period";
import { statsCsv } from "@/src/admin/statsCsv";
import { readStats } from "@/src/stats/stats";
import { errorResponse } from "@/src/lib/apiResponse";
import type { NextRequest } from "next/server";

/** The dashboard's counters as CSV. proxy.ts checks the admin password first. */
export async function GET(request: NextRequest) {
  const days = adminPeriod(request.nextUrl.searchParams.get("days"));
  const stats = await readStats(days);
  if (!stats) return errorResponse("No Redis store is connected.", 404);
  return new Response(statsCsv(stats), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="omnivix-stats-${days}-days.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
