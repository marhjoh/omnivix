import { describe, expect, it } from "vitest";
import { getTemplates } from "@/src/templates/registry";
import { EXAMPLE_LINK, EXAMPLE_REQUEST, exportApiDocs } from "./apiDocs";
import { parseLinkSettings } from "@/src/studio/parseLinkSettings";
import { parseExportRequest } from "./payload";
import { studioPath } from "@/src/lib/site";

const docs = exportApiDocs(new URL("https://omnivix.example")).join("\n");

describe("exportApiDocs", () => {
  it("documents every template and every setting", () => {
    for (const { meta, schema } of getTemplates()) {
      expect(docs).toContain(`(\`${meta.id}\`)`);
      for (const field of schema.filter((f) => f.type !== "sizeSelect")) {
        expect(docs).toContain(`| \`${field.key}\` |`);
      }
    }
  });

  it("keeps every settings row at three cells, even with | in a value", () => {
    const keys = new Set<string>(
      getTemplates().flatMap(({ schema }) =>
        schema.filter((f) => f.type !== "sizeSelect").map((f) => f.key),
      ),
    );
    const rows = docs.split("\n").filter((line) => keys.has(/^\| `([^`]+)`/.exec(line)?.[1] ?? ""));
    for (const row of rows) {
      expect(row.replaceAll("\\|", "").split("|"), row).toHaveLength(5);
    }
  });

  it("shows an example the API accepts", () => {
    expect(docs).toContain(JSON.stringify(EXAMPLE_REQUEST));
    expect(parseExportRequest(EXAMPLE_REQUEST).ok).toBe(true);
  });
});

describe("studio link and image URL docs", () => {
  it("shows a link the studio reads in full", () => {
    const query = new URLSearchParams(EXAMPLE_LINK.query).toString();
    expect(docs).toContain(`${studioPath(EXAMPLE_LINK.templateId)}?${query}`);
    const link = parseLinkSettings(EXAMPLE_LINK.templateId, EXAMPLE_LINK.query);
    const { username, ...settings } = EXAMPLE_LINK.query;
    expect(link).toEqual({ settings, username });
  });

  it("shows the same query as an image URL", () => {
    const query = new URLSearchParams(EXAMPLE_LINK.query).toString();
    expect(docs).toContain(`/banner/${EXAMPLE_LINK.templateId}.png?${query}`);
  });
});
