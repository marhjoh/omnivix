import { describe, expect, it } from "vitest";
import { createExportToken, consumeExportToken } from "./session-store";

describe("export session token", () => {
  it("round-trips a valid payload", () => {
    const token = createExportToken({
      templateId: "quote-banner",
      format: "png",
      size: "xHeader",
      scale: 2,
      pixelRatio: 2,
      state: { quote: "hello", author: "omnivix", themeId: "midnight", alignment: "left" },
    });
    const payload = consumeExportToken(token);
    expect(payload?.templateId).toBe("quote-banner");
    expect(payload?.format).toBe("png");
  });

  it("rejects a tampered token", () => {
    const token = createExportToken({
      templateId: "quote-banner",
      format: "png",
      size: "xHeader",
      scale: 2,
      pixelRatio: 2,
      state: { quote: "hello", author: "omnivix", themeId: "midnight", alignment: "left" },
    });
    const tampered = `${token}broken`;
    expect(consumeExportToken(tampered)).toBeNull();
  });
});
