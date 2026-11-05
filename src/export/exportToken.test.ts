import { describe, expect, it, vi } from "vitest";
import { createExportToken, verifyExportToken } from "./exportToken";

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

  it("verifies across separate copies of the module without EXPORT_TOKEN_SECRET", async () => {
    // Next bundles the export route and the render page separately, each with its own copy.
    vi.stubEnv("EXPORT_TOKEN_SECRET", "");
    const token = createExportToken(samplePayload);
    vi.resetModules();
    const otherCopy = await import("./exportToken");
    expect(otherCopy.verifyExportToken(token)?.templateId).toBe("quote-banner");
    vi.unstubAllEnvs();
  });
});
