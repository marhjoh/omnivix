import { describe, expect, it } from "vitest";
import {
  activeDays,
  decodeAiUsage,
  encodeAiUsage,
  firstActiveDay,
  USAGE_DAYS,
  usageCalendar,
  type AiUsage,
} from "./aiUsage";

const usage: AiUsage = {
  end: "2026-11-07",
  levels: "0".repeat(USAGE_DAYS - 3) + "142",
  tokens: 1_234_567,
  cost: 89,
  models: [
    { name: "Sonnet 4.5", percent: 70 },
    { name: "GPT-5", percent: 30 },
  ],
  agents: [{ name: "Claude Code", percent: 100 }],
};

describe("encodeAiUsage", () => {
  it("writes what decodeAiUsage reads back", () => {
    expect(decodeAiUsage(encodeAiUsage(usage))).toEqual(usage);
    expect(decodeAiUsage(encodeAiUsage({ ...usage, cost: null, agents: [] }))).toEqual({
      ...usage,
      cost: null,
      agents: [],
    });
  });
});

describe("decodeAiUsage", () => {
  const encoded = encodeAiUsage(usage);
  it.each([
    ["an invalid date", encoded.replace("2026-11-07", "2026-02-30")],
    ["a missing day", encoded.replace("/0", "/")],
    ["a level above 4", encoded.replace("142", "152")],
    ["a negative cost", encoded.replace("/89/", "/-89/")],
    ["a share above 100", encoded.replace(":100", ":101")],
    ["a name with a slash", encoded.replace("GPT-5", "GPT/5")],
    ["a name with a colon", encoded.replace("GPT-5", "GPT:5")],
    ["an extra field", `${encoded}/x`],
    ["a missing field", encoded.slice(0, encoded.lastIndexOf("/"))],
  ])("rejects %s", (_, text) => {
    expect(decodeAiUsage(text)).toBeNull();
  });
});

describe("usageCalendar", () => {
  const days = (levels: string) =>
    usageCalendar({ ...usage, levels }).weeks.flatMap((week) => week.days);

  it("shows 13 weeks for a short paste, ending on the last day", () => {
    const shown = days(usage.levels);
    expect(shown).toHaveLength(91);
    expect(shown[0].date).toBe("2026-08-09");
    expect(shown.at(-1)).toEqual({ date: "2026-11-07", count: 2, level: 2, weekday: 6 });
  });

  it("starts on the first day with usage when that's further back", () => {
    const shown = days("0".repeat(165) + "3" + "0".repeat(USAGE_DAYS - 166));
    expect(shown).toHaveLength(200);
    expect(shown[0]).toMatchObject({ date: "2026-04-22", level: 3 });
  });

  it("shows a year at most", () => {
    const shown = days("1".repeat(USAGE_DAYS));
    expect(shown).toHaveLength(USAGE_DAYS);
    expect(shown[0].date).toBe("2025-11-08");
  });

  it("starts each week on a Sunday", () => {
    for (const week of usageCalendar(usage).weeks.slice(1)) expect(week.days[0].weekday).toBe(0);
  });

  it("labels each month, starting with the first day shown", () => {
    const { months } = usageCalendar(usage);
    expect(months.map(({ firstDay }) => firstDay)).toEqual([
      "2026-08-09",
      "2026-09-01",
      "2026-10-01",
      "2026-11-01",
    ]);
  });

  it("counts active days and finds the first one", () => {
    expect(activeDays(usage)).toBe(3);
    expect(firstActiveDay(usage)).toBe("2026-11-05");
  });
});
