import { describe, expect, it } from "vitest";
import { isTemplateId } from "./registry";

describe("isTemplateId", () => {
  it("accepts the templates", () => {
    expect(isTemplateId("github-banner")).toBe(true);
    expect(isTemplateId("quote-banner")).toBe(true);
  });

  it.each(["nope", "constructor", "toString", "__proto__", "hasOwnProperty"])(
    "rejects %s",
    (id) => {
      expect(isTemplateId(id)).toBe(false);
    },
  );
});
