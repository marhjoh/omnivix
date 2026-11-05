import type { Metadata } from "next";
import { AdminDashboard } from "@/src/admin/AdminDashboard";
import { adminPeriod } from "@/src/admin/period";
import { metricById } from "@/src/admin/summary";
import { SiteShell } from "@/src/landing/SiteShell";
import { readStats } from "@/src/stats/stats";

export const metadata: Metadata = { title: "Stats" };

/** Only reachable with the admin password, which proxy.ts checks on every request. */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string | string[]; metric?: string | string[] }>;
}) {
  const query = await searchParams;
  const period = adminPeriod(query.days);
  return (
    <SiteShell>
      <AdminDashboard
        period={period}
        metric={metricById(query.metric)}
        // Twice the period, to compare it with the one before.
        stats={await readStats(period * 2)}
        environment={process.env.VERCEL_ENV || "development"}
      />
    </SiteShell>
  );
}
