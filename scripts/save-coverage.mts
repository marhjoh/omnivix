// Saves the test coverage of lines to the stats store, for /admin. CI runs it after
// `pnpm test --coverage` on main. Without the Redis variables it does nothing.
import { readFile } from "node:fs/promises";
import { COVERAGE_FIELD, saveQuality } from "@/src/stats/quality";

const summary = JSON.parse(await readFile("coverage/coverage-summary.json", "utf8")) as {
  total: { lines: { pct: number } };
};
const percent = summary.total.lines.pct;
const saved = await saveQuality({ [COVERAGE_FIELD]: percent });
console.log(saved ? `Saved ${percent}% line coverage.` : "No stats store, so nothing was saved.");
