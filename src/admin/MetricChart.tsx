import type { ChartPoint } from "@/src/admin/summary";
import styles from "@/src/admin/admin.module.css";

const WIDTH = 1000;
const HEIGHT = 200;

/** The chosen metric over the period, with the previous period as a dashed line. */
export function MetricChart({
  label,
  points,
  daysPerPoint,
}: {
  label: string;
  points: ChartPoint[];
  daysPerPoint: number;
}) {
  const top = Math.max(1, ...points.flatMap(({ value, previous }) => [value, previous]));
  const x = (index: number) => (index / (points.length - 1)) * WIDTH;
  const y = (value: number) => HEIGHT - (value / top) * HEIGHT;
  const line = (values: number[]) =>
    values.map((value, index) => `${index ? "L" : "M"}${x(index)},${y(value)}`).join("");
  const unit = daysPerPoint === 1 ? "day" : "week";

  return (
    <figure>
      <figcaption className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="font-semibold">
          {label} per {unit}
        </span>
        <span className="flex gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-accent" aria-hidden />
            This period
          </span>
          <span className="flex items-center gap-1.5">
            <span className={styles.dashedSwatch} aria-hidden />
            Previous period
          </span>
        </span>
      </figcaption>

      <div className="relative mt-4 ml-10 h-52">
        {[top, 0].map((tick) => (
          <span
            key={tick}
            className="absolute -left-10 w-8 -translate-y-1/2 text-right text-xs text-muted tabular-nums"
            style={{ top: `${100 - (tick / top) * 100}%` }}
          >
            {tick.toLocaleString("en-US")}
          </span>
        ))}
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
        >
          {[0, 0.5, 1].map((share) => (
            <line
              key={share}
              x1={0}
              x2={WIDTH}
              y1={HEIGHT * share}
              y2={HEIGHT * share}
              className={share === 1 ? styles.baseline : styles.gridline}
            />
          ))}
          <path d={line(points.map(({ previous }) => previous))} className={styles.previousLine} />
          <path d={line(points.map(({ value }) => value))} className={styles.line} />
        </svg>

        <ol className="absolute inset-0 flex">
          {points.map((point, index) => (
            <li
              key={point.day}
              className={`${styles.hoverColumn} group relative flex-1`}
              tabIndex={0}
            >
              <span
                className={styles.guide}
                style={{ left: `${(index / (points.length - 1)) * 100}%` }}
                aria-hidden
              >
                <span
                  className={styles.dot}
                  style={{ top: `${(y(point.value) / HEIGHT) * 100}%` }}
                />
              </span>
              {/* Opens toward the middle, so it stays inside the chart. */}
              <span
                className={`${styles.tooltip} ${index < points.length / 2 ? "left-0" : "right-0"}`}
              >
                <span className="block font-medium text-text">{dayLabel(point.day, unit)}</span>
                <span className="block">
                  {point.value.toLocaleString("en-US")}
                  {index === points.length - 1 ? " so far" : ""}
                </span>
                <span className="block text-muted">
                  Previous: {point.previous.toLocaleString("en-US")}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-2 ml-10 flex justify-between text-xs text-muted">
        <span>{dayLabel(points[0].day, unit)}</span>
        <span>{unit === "day" ? "Today" : "This week"} so far</span>
      </div>
    </figure>
  );
}

function dayLabel(day: string, unit: string): string {
  const date = new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return unit === "day" ? date : `Week of ${date}`;
}
