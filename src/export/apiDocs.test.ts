import { describe, expect, it } from "vitest";
import { getTemplates } from "@/src/templates/registry";
import { EXAMPLE_LINK, EXAMPLE_REQUEST, exportApiDocs } from "./apiDocs";
import { parseLinkSettings } from "@/src/studio/linkSettings";
import { parseExportRequest } from "./payload";

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

  it("shows an example the API accepts", () => {
    expect(docs).toContain(JSON.stringify(EXAMPLE_REQUEST));
    expect(parseExportRequest(EXAMPLE_REQUEST).ok).toBe(true);
  });
});

describe("studio link docs", () => {
  it("shows a link the studio reads in full", () => {
    const query = new URLSearchParams(EXAMPLE_LINK.query).toString();
    expect(docs).toContain(`/studio/${EXAMPLE_LINK.templateId}?${query}`);
    const link = parseLinkSettings(EXAMPLE_LINK.templateId, EXAMPLE_LINK.query);
    const { username, ...settings } = EXAMPLE_LINK.query;
    expect(link).toEqual({ settings, username });
  });
});
