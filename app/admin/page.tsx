import type { Metadata } from "next";
import { AdminDashboard } from "@/src/admin/AdminDashboard";
import { adminPeriod } from "@/src/admin/period";
import { metricById, withStars } from "@/src/admin/summary";
import { SiteShell } from "@/src/landing/SiteShell";
import { loadRepoStars } from "@/src/stats/stars";
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
  // Twice the period, to compare it with the one before.
  const [stats, stars] = await Promise.all([readStats(period * 2), loadRepoStars()]);
  const starsPerDay = stars?.perDay;
  const metric = metricById(query.metric);
  return (
    <SiteShell>
      <AdminDashboard
        period={period}
        // Without the star history there's no New stars tile to pick.
        metric={metric.id === "stars" && !starsPerDay ? metricById(undefined) : metric}
        stats={stats && starsPerDay ? withStars(stats, starsPerDay) : stats}
        stars={stars}
        environment={process.env.VERCEL_ENV || "development"}
      />
    </SiteShell>
  );
}
