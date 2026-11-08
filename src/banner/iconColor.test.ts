import { describe, expect, it } from "vitest";
import { brandIconColor } from "./iconColor";

describe("brandIconColor", () => {
  it("keeps a brand color that shows on the card", () => {
    expect(brandIconColor("3178C6", "dark")).toBe("#3178C6");
    expect(brandIconColor("3178C6", "light")).toBe("#3178C6");
  });

  it("drops black in dark mode and white in light mode", () => {
    expect(brandIconColor("000000", "dark")).toBeUndefined();
    expect(brandIconColor("000000", "light")).toBe("#000000");
    expect(brandIconColor("FFFFFF", "light")).toBeUndefined();
    expect(brandIconColor("FFFFFF", "dark")).toBe("#FFFFFF");
  });
});
