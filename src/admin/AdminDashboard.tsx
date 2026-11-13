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
  measurementRange,
  METRICS,
  type Change,
  type Metric,
} from "@/src/admin/summary";
import {
  COVERAGE_FIELD,
  STARS_FIELD,
  LIGHTHOUSE_CATEGORIES,
  LIGHTHOUSE_PAGES,
  lighthouseField,
} from "@/src/stats/quality";
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
      <nav
        aria-label="Chart"
        className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
      >
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

      <Section
        title="AI agents"
        note="Requests for llms.txt, by who sent them. Page views leave bots out."
      >
        <Breakdown title="llms.txt readers" totals={totals} series={SERIES.llmsReader} />
      </Section>

      <Section title="Problems">
        <Breakdown title="Limit hits" totals={totals} series={SERIES.limits} />
        <Card title="Failure messages">
          <FailureMessages rows={breakdown(totals, SERIES.failureMessage)} />
        </Card>
      </Section>

      <Section title="Project">
        <div className="grid grid-cols-2 content-start gap-3">
          <MeasurementTile
            label="GitHub stars"
            values={measurements(current, STARS_FIELD)}
            change={(gained) => `${formatCount(gained)} in this period`}
            format={formatCount}
          />
          <MeasurementTile
            label="Test coverage"
            values={measurements(current, COVERAGE_FIELD)}
            change={(points) => `${points} points in this period`}
            format={(percent) => `${percent}%`}
          />
        </div>
        <Lighthouse current={current} />
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
  // A change under 0.5% rounds to 0%, so the difference says more.
  const amount = percent ? `${Math.abs(percent)}%` : formatCount(Math.abs(difference));
  return (
    <ArrowLine up={difference > 0}>
      {amount} vs. {before}
    </ArrowLine>
  );
}

function ArrowLine({ up, children }: { up: boolean; children: ReactNode }) {
  const Arrow = up ? ArrowUp : ArrowDown;
  return (
    <span className="mt-1 flex items-start gap-1 text-xs text-muted">
      <Arrow size={12} className="mt-0.5 shrink-0" aria-hidden />
      <span>
        <span className="sr-only">{up ? "Up " : "Down "}</span>
        {children}
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

/** A measurement's values in the period, oldest first, skipping days without one. */
function measurements(days: DailyStats[], field: string): number[] {
  return days.flatMap(({ counts }) => (field in counts ? [counts[field]] : []));
}

/** Like the tiles above the chart, for a value that's measured instead of counted. */
function MeasurementTile({
  label,
  values,
  change,
  format,
}: {
  label: string;
  values: number[];
  /** The text after the arrow, for the change since the period's first value. */
  change: (amount: number) => string;
  format: (value: number) => string;
}) {
  const first = values[0];
  const last = values.at(-1);
  const difference = last === undefined ? 0 : Math.round((last - first) * 10) / 10;
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <span className="block text-sm text-muted">{label}</span>
      {last === undefined ? (
        <span className="mt-1 block text-xs text-muted">Not measured in this period</span>
      ) : (
        <>
          <span className="mt-1 block text-3xl font-semibold tabular-nums">{format(last)}</span>
          {difference ? (
            <ArrowLine up={difference > 0}>{change(Math.abs(difference))}</ArrowLine>
          ) : (
            <span className="mt-1 block text-xs text-muted">No change in this period</span>
          )}
        </>
      )}
    </div>
  );
}

const PAGE_LABELS: Record<keyof typeof LIGHTHOUSE_PAGES, string> = {
  landing: "Landing page",
  studio: "Studio",
};

const CATEGORY_LABELS: Record<(typeof LIGHTHOUSE_CATEGORIES)[number], string> = {
  performance: "Performance",
  accessibility: "Accessibility",
  "best-practices": "Best practices",
  seo: "SEO",
};

function Lighthouse({ current }: { current: DailyStats[] }) {
  const pages = Object.keys(LIGHTHOUSE_PAGES) as (keyof typeof LIGHTHOUSE_PAGES)[];
  const latest = (page: string, category: string) =>
    measurementRange(current, lighthouseField(page, category))?.last;
  const measured = pages.flatMap((page) =>
    LIGHTHOUSE_CATEGORIES.map((category) => latest(page, category)),
  );
  return (
    <Card title="Lighthouse on a phone">
      {measured.some(Boolean) ? (
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="pb-2 font-normal">Score</th>
              {pages.map((page) => (
                <th key={page} className="pb-2 text-right font-normal">
                  {PAGE_LABELS[page]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LIGHTHOUSE_CATEGORIES.map((category) => (
              <tr key={category} className="border-t border-divider">
                <td className="py-2">{CATEGORY_LABELS[category]}</td>
                {pages.map((page) => (
                  <td key={page} className="py-2 text-right tabular-nums">
                    {latest(page, category)?.value ?? "–"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-muted">Not measured in this period.</p>
      )}
    </Card>
  );
}
