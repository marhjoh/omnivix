import { describe, expect, it } from "vitest";
import { createExportToken, verifyExportToken } from "./export-token";

const samplePayload = {
  templateId: "quote-banner" as const,
  size: "header" as const,
  pixelRatio: 2 as const,
  state: { quote: "hello", author: "omnivix", themeId: "default", alignment: "left" },
};

describe("export token", () => {
  it("round-trips a valid payload", () => {
    const token = createExportToken(samplePayload);
    const payload = verifyExportToken(token);
    expect(payload?.templateId).toBe("quote-banner");
    expect(payload?.state).toEqual(samplePayload.state);
  });

  it("round-trips state with a sizeable string field", () => {
    const huge = "x".repeat(10_000);
    const token = createExportToken({
      ...samplePayload,
      state: { ...samplePayload.state, backgroundImage: huge },
    });
    const out = verifyExportToken(token);
    expect(out?.state.backgroundImage).toBe(huge);
  });

  it("rejects a tampered token", () => {
    const token = createExportToken(samplePayload);
    const [encoded, sig] = token.split(".");
    const tampered = `${encoded.slice(0, -1)}y.${sig}`;
    expect(verifyExportToken(tampered)).toBeNull();
  });

  it("allows repeat verification until expiry", () => {
    const token = createExportToken(samplePayload);
    expect(verifyExportToken(token)).not.toBeNull();
    expect(verifyExportToken(token)).not.toBeNull();
  });
});
