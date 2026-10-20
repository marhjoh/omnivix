import type { CSSProperties } from "react";
import {
  calendarColumns,
  codeColor,
  isQuietDay,
  type ErrorCode,
} from "@/src/error-pages/calendarGlyphs";
import styles from "@/src/error-pages/errorPages.module.css";

/** A contribution calendar whose brightest days spell the code. */
export function CodeCalendar({ code }: { code: ErrorCode }) {
  const columns = calendarColumns(code);
  return (
    <div
      className={styles.calendar}
      style={
        {
          gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
          "--level": codeColor(code),
        } as CSSProperties
      }
      role="img"
      aria-label={code}
    >
      {columns.flatMap((column, x) =>
        column.map((on, y) => (
          <span
            key={`${x}-${y}`}
            className={`${styles.cell} ${on ? styles.cellOn : isQuietDay(x, y) ? styles.cellQuiet : ""}`}
            style={{ "--col": x } as CSSProperties}
          />
        )),
      )}
    </div>
  );
}
