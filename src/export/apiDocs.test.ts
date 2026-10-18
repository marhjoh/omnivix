import { describe, expect, it } from "vitest";
import { getTemplates } from "@/src/templates/registry";
import { EXAMPLE_REQUEST, exportApiDocs } from "./apiDocs";
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
