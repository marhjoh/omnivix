import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Download } from "lucide-react";
import { breakdown, SERIES } from "@/src/stats/statFields";
import { sumStats, visitorsField, type DailyStats } from "@/src/stats/stats";
import { ADMIN_PERIODS, type AdminPeriod } from "@/src/admin/period";
import {
  changeOf,
  chartPoints,
  durationPercentile,
  METRICS,
  type Change,
  type Metric,
} from "@/src/admin/summary";
import { valueLabel } from "@/src/admin/labels";
import { MetricChart } from "@/src/admin/MetricChart";
import styles from "@/src/admin/admin.module.css";

/** Long lists show their top rows. The CSV has them all. */
const TOP_ROWS = 10;

function adminHref(period: AdminPeriod, metric: Metric) {
  return `/admin?days=${period}&metric=${metric.id}`;
}

function formatCount(count: number): string {
  return count.toLocaleString("en-US");
}

/** Visits, exports and problems for the chosen period, each compared with the period before. */
export function AdminDashboard({
  period,
  metric,
  stats,
  environment,
}: {
  period: AdminPeriod;
  metric: Metric;
  /** Twice the period: the one before it comes first. */
  stats: DailyStats[] | null;
  environment: string;
}) {
  return (
    <main className="flex-1 bg-bg px-4 pt-12 pb-20 text-text sm:pt-16">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="gradient-text text-5xl font-extrabold tracking-[-0.05em] sm:text-6xl">
              Stats.
            </h1>
            <p className="mt-2 text-sm text-muted">Data from the {environment} environment.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <nav aria-label="Period" className="flex flex-wrap gap-2">
              {ADMIN_PERIODS.map((days) => (
                <Link
                  key={days}
                  href={adminHref(days, metric)}
                  aria-current={days === period ? "page" : undefined}
                  className={`btn-secondary ${styles.selected}`}
                >
                  {days} days
                </Link>
              ))}
            </nav>
            {stats && (
              <a href={`/admin/stats.csv?days=${period}`} download className="btn-secondary">
                <Download size={16} aria-hidden />
                CSV
              </a>
            )}
          </div>
        </header>
        {stats ? (
          <Stats period={period} metric={metric} stats={stats} />
        ) : (
          <p className="mt-10 text-muted">
            No Redis store is connected, so nothing is counted. Set <code>KV_REST_API_URL</code> and{" "}
            <code>KV_REST_API_TOKEN</code>.
          </p>
        )}
      </div>
    </main>
  );
}

function Stats({
  period,
  metric,
  stats,
}: {
  period: AdminPeriod;
  metric: Metric;
  stats: DailyStats[];
}) {
  const previous = stats.slice(0, -period);
  const current = stats.slice(-period);
  const totals = sumStats(current);
  const before = sumStats(previous);
  const { points, daysPerPoint } = chartPoints(current, previous, metric.field);

  return (
    <>
      <nav aria-label="Chart" className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-5">
        {METRICS.map((tile) => (
          <Link
            key={tile.id}
            href={adminHref(period, tile)}
            scroll={false}
            aria-current={tile.id === metric.id ? "page" : undefined}
            className={`${styles.tile} ${styles.selected} rounded-xl p-4`}
          >
            <span className="block text-sm text-muted">{tile.label}</span>
            <span className="mt-1 block text-3xl font-semibold tabular-nums">
              {formatCount(totals[tile.field] ?? 0)}
            </span>
            <ChangeLine
              change={changeOf(totals[tile.field] ?? 0, before[tile.field] ?? 0)}
              period={period}
            />
          </Link>
        ))}
      </nav>

      <Card className="mt-6">
        <MetricChart label={metric.label} points={points} daysPerPoint={daysPerPoint} />
      </Card>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Funnel totals={totals} />
        <ExportTime totals={totals} />
      </div>

      <Section title="Visits">
        <Breakdown title="Pages" totals={totals} series={SERIES.page} />
        <Breakdown title="Sources" totals={totals} series={SERIES.referrer} />
        <Breakdown title="Countries" totals={totals} series={SERIES.country} />
        <Breakdown title="Devices" totals={totals} series={SERIES.device} />
        <Breakdown title="Browsers" totals={totals} series={SERIES.browser} />
      </Section>

      <Section
        title="Exports"
        note="Image URLs only count fresh renders, not copies the CDN served."
      >
        <Breakdown title="Export method" totals={totals} series={SERIES.source} />
        <Breakdown title="Templates" totals={totals} series={SERIES.template} />
        <Breakdown title="Sizes" totals={totals} series={SERIES.size} />
        <Breakdown title="Backgrounds" totals={totals} series={SERIES.background} />
        <Breakdown title="Grid colors" totals={totals} series={SERIES.gridColors} />
        <Breakdown title="App theme" totals={totals} series={SERIES.uiTheme} />
        <Breakdown title="File formats" totals={totals} series={SERIES.format} />
      </Section>

      <Section title="Problems">
        <Breakdown title="Limit hits" totals={totals} series={SERIES.limits} />
        <Card title="Failure messages">
          <FailureMessages rows={breakdown(totals, SERIES.failureMessage)} />
        </Card>
      </Section>
    </>
  );
}

function ChangeLine({
  change: { difference, percent },
  period,
}: {
  change: Change;
  period: AdminPeriod;
}) {
  const before = period === 365 ? "the year before" : `the ${period} days before`;
  if (!difference) {
    return <span className="mt-1 block text-xs text-muted">Same as {before}</span>;
  }
  const Arrow = difference > 0 ? ArrowUp : ArrowDown;
  // A change under 0.5% rounds to 0%, so the difference says more.
  const amount = percent ? `${Math.abs(percent)}%` : formatCount(Math.abs(difference));
  return (
    <span className="mt-1 flex items-start gap-1 text-xs text-muted">
      <Arrow size={12} className="mt-0.5 shrink-0" aria-hidden />
      <span>
        <span className="sr-only">{difference > 0 ? "Up " : "Down "}</span>
        {amount} vs. {before}
      </span>
    </span>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="gradient-text text-3xl font-extrabold tracking-[-0.04em]">{title}.</h2>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
      <div className="mt-5 grid gap-6 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Card({
  title,
  className = "",
  children,
}: {
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-border bg-surface p-5 ${className}`}>
      {title && <h3 className="mb-4 text-base font-semibold">{title}</h3>}
      {children}
    </section>
  );
}

/** A row with a bar behind its share of the largest row. */
function BarRow({
  label,
  count,
  max,
  note,
}: {
  label: string;
  count: number;
  max: number;
  note?: string;
}) {
  return (
    <li className="grid grid-cols-[minmax(0,2fr)_minmax(3rem,3fr)_auto] items-center gap-3">
      <span className="text-sm wrap-break-word">{label}</span>
      <span className="h-2 rounded-r-sm bg-surface-2">
        <span
          className="block h-full rounded-r-sm bg-accent"
          style={{ width: `${max ? (count / max) * 100 : 0}%` }}
        />
      </span>
      <span className="text-right text-sm tabular-nums">
        {formatCount(count)}
        {note && <span className="ml-1.5 text-xs text-muted">{note}</span>}
      </span>
    </li>
  );
}

function Breakdown({
  title,
  totals,
  series,
}: {
  title: string;
  totals: Record<string, number>;
  series: string;
}) {
  const all = breakdown(totals, series);
  const rows = all.slice(0, TOP_ROWS);
  const max = Math.max(0, ...rows.map(([, count]) => count));
  return (
    <Card title={title}>
      {rows.length ? (
        <ul className="space-y-2">
          {rows.map(([value, count]) => (
            <BarRow key={value} label={valueLabel(series, value)} count={count} max={max} />
          ))}
        </ul>
      ) : (
        <Empty />
      )}
      {all.length > rows.length && (
        <p className="mt-3 text-xs text-muted">{all.length - rows.length} more in the CSV</p>
      )}
    </Card>
  );
}

function Empty() {
  return <p className="text-sm text-muted">None in this period.</p>;
}

function Funnel({ totals }: { totals: Record<string, number> }) {
  const steps = [
    { label: "Visited", count: totals[visitorsField("site")] ?? 0 },
    { label: "Opened the studio", count: totals[visitorsField("studio")] ?? 0 },
    { label: "Downloaded or copied", count: totals[visitorsField("export")] ?? 0 },
  ];
  const visitors = steps[0].count;
  return (
    <Card title="From visit to export">
      {visitors ? (
        <ul className="space-y-2">
          {steps.map(({ label, count }) => (
            <BarRow
              key={label}
              label={label}
              count={count}
              max={visitors}
              note={`${Math.round((count / visitors) * 100)}%`}
            />
          ))}
        </ul>
      ) : (
        <Empty />
      )}
      <p className="mt-3 text-xs text-muted">
        Visitors are counted once a day. Someone who comes back another day counts again.
      </p>
    </Card>
  );
}

function ExportTime({ totals }: { totals: Record<string, number> }) {
  const median = durationPercentile(totals, 0.5);
  return (
    <Card title="Export time">
      {median === null ? (
        <Empty />
      ) : (
        <p className="text-sm">
          Half take <strong className="tabular-nums">{median} s</strong> or less, and 95% take{" "}
          <strong className="tabular-nums">{durationPercentile(totals, 0.95)} s</strong> or less.
        </p>
      )}
    </Card>
  );
}

function FailureMessages({ rows }: { rows: [string, number][] }) {
  if (!rows.length) return <Empty />;
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-muted">
        <tr>
          <th className="pb-2 font-normal">Message</th>
          <th className="pb-2 text-right font-normal">Count</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([message, count]) => (
          <tr key={message} className="border-t border-divider">
            <td className="py-2 pr-4 font-mono text-xs wrap-anywhere">{message}</td>
            <td className="py-2 text-right tabular-nums">{formatCount(count)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
