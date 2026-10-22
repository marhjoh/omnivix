import { describe, expect, it } from "vitest";
import { getTemplates } from "@/src/templates/registry";
import { fieldLabel, groupFields } from "./settingGroups";

const outline = (id: string) => {
  const template = getTemplates().find(({ meta }) => meta.id === id)!;
  return groupFields(template.schema).map((g) => [g.title, g.fields.map((f) => f.key)]);
};

describe("groupFields", () => {
  it("groups the GitHub banner's settings", () => {
    expect(outline("github-banner")).toEqual([
      ["Format", ["size"]],
      ["Style", ["themeId", "cellShape", "backgroundImage"]],
      ["Layout", ["alignment", "profilePosition", "contentSize"]],
      [
        "Content",
        ["year", "showMonthLabels", "showDayLabels", "showTotal", "showAvatar", "showDisplayName"],
      ],
    ]);
  });

  it("gives the repos banner a Repositories group", () => {
    expect(outline("repos-banner").map(([title]) => title)).toEqual([
      "Format",
      "Style",
      "Layout",
      "Repositories",
      "Content",
    ]);
  });

  it("keeps every setting except the username, once", () => {
    for (const { meta, schema } of getTemplates()) {
      const grouped = groupFields(schema).flatMap((g) => g.fields.map((f) => f.key));
      const expected = schema.map((f) => f.key).filter((key) => key !== "username");
      expect(grouped.toSorted(), meta.id).toEqual(expected.toSorted());
    }
  });
});

describe("fieldLabel", () => {
  it("renames settings whose schema name is unclear in the sidebar", () => {
    expect(fieldLabel({ key: "size", label: "Type", type: "sizeSelect" })).toBe("Aspect ratio");
    expect(fieldLabel({ key: "year", label: "Year", type: "select" })).toBe("Year");
  });
});
