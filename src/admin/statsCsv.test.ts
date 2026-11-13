import { describe, expect, it } from "vitest";
import { statsCsv } from "./statsCsv";

describe("statsCsv", () => {
  it("writes a row per day and a column per counter", () => {
    const csv = statsCsv([
      { day: "2026-11-04", counts: { visitors: 3, exports: 1 } },
      { day: "2026-11-05", counts: { exports: 2, "views:source:reddit.com": 1 } },
    ]);
    expect(csv).toBe(
      "day_utc,exports,views:source:reddit.com,visitors\r\n" +
        "2026-11-04,1,0,3\r\n" +
        "2026-11-05,2,1,0\r\n",
    );
  });

  it("leaves a cell blank on a day without a measurement", () => {
    const csv = statsCsv([
      { day: "2026-11-04", counts: { exports: 1, "quality:stars": 10 } },
      { day: "2026-11-05", counts: {} },
    ]);
    expect(csv).toBe("day_utc,exports,quality:stars\r\n2026-11-04,1,10\r\n2026-11-05,0,\r\n");
  });

  it("quotes commas and quotes, and keeps formulas from running", () => {
    const csv = statsCsv([
      { day: "2026-11-05", counts: { 'failures:message:Bad "x", y': 1, "=cmd": 1 } },
    ]);
    expect(csv.split("\r\n")[0]).toBe(`day_utc,'=cmd,"failures:message:Bad ""x"", y"`);
  });
});
