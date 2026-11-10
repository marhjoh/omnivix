import { describe, expect, it } from "vitest";
import { getTemplates } from "@/src/templates/registry";
import type { EditorFieldSchema } from "@/src/templates/types";
import { groupFields, STYLE_GROUP } from "./settingGroups";

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
      ["Logo", ["logoImage", "logoSize"]],
      ["Credit", ["credit", "creditContent", "creditSize"]],
      [
        "Content",
        ["year", "showAvatar", "showDisplayName", "showMonthLabels", "showDayLabels", "showTotal"],
      ],
    ]);
  });

  it("keeps the Style group without any of its settings, for the light/dark setting", () => {
    const schema: EditorFieldSchema[] = [{ key: "year", label: "Year", type: "select" }];
    expect(groupFields(schema).map((g) => g.title)).toEqual([STYLE_GROUP, "Content"]);
  });

  it("keeps every setting, once", () => {
    for (const { meta, schema } of getTemplates()) {
      const grouped = groupFields(schema).flatMap((g) => g.fields.map((f) => f.key));
      expect(grouped.toSorted(), meta.id).toEqual(schema.map((f) => f.key).toSorted());
    }
  });
});
