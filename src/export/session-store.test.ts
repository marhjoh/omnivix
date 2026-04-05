import { describe, expect, it } from "vitest";
import { createExportToken, consumeExportToken } from "./session-store";

const samplePayload = {
  templateId: "quote-banner" as const,
  format: "png" as const,
  size: "xHeader" as const,
  scale: 2 as const,
  pixelRatio: 2 as const,
  state: { quote: "hello", author: "omnivix", themeId: "default", alignment: "left" },
};

describe("export session token", () => {
  it("round-trips a valid payload", () => {
    const token = createExportToken(samplePayload);
    const payload = consumeExportToken(token);
    expect(payload?.templateId).toBe("quote-banner");
    expect(payload?.format).toBe("png");
  });

  it("keeps tokens short even with large state", () => {
    const huge = "x".repeat(800_000);
    const token = createExportToken({
      ...samplePayload,
      state: { ...samplePayload.state, backgroundImage: huge },
    });
    expect(token.length).toBeLessThan(512);
    const out = consumeExportToken(token);
    expect(out?.state.backgroundImage).toBe(huge);
  });

  it("rejects a tampered token", () => {
    const token = createExportToken(samplePayload);
    const tampered = `${token}broken`;
    expect(consumeExportToken(tampered)).toBeNull();
  });

  it("is single-use: second consume returns null", () => {
    const token = createExportToken(samplePayload);
    expect(consumeExportToken(token)).not.toBeNull();
    expect(consumeExportToken(token)).toBeNull();
  });
});
