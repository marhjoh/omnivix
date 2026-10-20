import type { CSSProperties, ReactNode } from "react";
import { themePresetById } from "@/src/types/theme";
import landingStyles from "@/src/landing/landing.module.css";

/** 5 × 7 pixel glyphs for the calendar. */
const GLYPHS = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "4": ["10010", "10010", "10010", "11111", "00010", "00010", "00010"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
} as const;

type Glyph = keyof typeof GLYPHS;

/** Columns of on/off cells: two blank columns each side, one between glyphs. */
function calendarColumns(glyphs: Glyph[]): boolean[][] {
  const blank = Array<boolean>(7).fill(false);
  const columns = glyphs.flatMap((glyph) => [
    blank,
    ...Array.from({ length: 5 }, (_, x) => GLYPHS[glyph].map((row) => row[x] === "1")),
  ]);
  return [blank, ...columns, blank, blank];
}

/** A stable, sparse scatter of quiet days around the code, like a real calendar. */
function isQuietDay(x: number, y: number): boolean {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n) >= 0.9;
}

function CodeCalendar({ code, themeId }: { code: Glyph[]; themeId: string }) {
  const columns = calendarColumns(code);
  const levels = themePresetById(themeId).gridLevels;
  return (
    <div className="max-w-2xl">
      <div
        className={landingStyles.errorHeatmap}
        style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
        role="img"
        aria-label={code.join("")}
      >
        {columns.flatMap((column, x) =>
          column.map((on, y) => (
            <span
              key={`${x}-${y}`}
              className={`${landingStyles.errorCell} ${
                on
                  ? landingStyles.errorCellOn
                  : isQuietDay(x, y)
                    ? landingStyles.errorCellQuiet
                    : ""
              }`}
              style={{ "--col": x, "--level": levels[4] } as CSSProperties}
            />
          )),
        )}
      </div>
    </div>
  );
}

/**
 * The 404 and error pages: a contribution calendar that spells the code, then a headline that
 * fills in, in the landing page's style. No hooks, so the error boundaries can use it too.
 */
export function ErrorScreen({
  code,
  themeId,
  title,
  children,
  actions,
}: {
  code: Glyph[];
  /** Grid colors for the calendar's lit cells. */
  themeId: string;
  title: string;
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <main className="flex-1 overflow-x-clip bg-bg px-4 pt-16 pb-20 sm:pt-24">
      <div className="mx-auto max-w-6xl">
        <CodeCalendar code={code} themeId={themeId} />
        <h1
          className={`${landingStyles.gradientText} ${landingStyles.errorHeading} mt-10 md:mt-14`}
        >
          {title}
        </h1>
        <div className="mt-4 max-w-xl text-lg leading-relaxed text-pretty text-muted">
          {children}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
      </div>
    </main>
  );
}
