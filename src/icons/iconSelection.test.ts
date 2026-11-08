import { describe, expect, it } from "vitest";
import { iconsUrl, isIconSelection, MAX_ICONS } from "./iconSelection";

describe("isIconSelection", () => {
  it("takes slugs, comma-separated", () => {
    expect(isIconSelection("typescript, nextdotjs,spring_creators")).toBe(true);
    expect(isIconSelection("")).toBe(true);
  });

  it("rejects names that aren't slugs, repeats and too many icons", () => {
    expect(isIconSelection("Next.js")).toBe(false);
    expect(isIconSelection("git, git")).toBe(false);
    expect(isIconSelection(Array.from({ length: MAX_ICONS + 1 }, (_, i) => `i${i}`).join())).toBe(
      false,
    );
  });
});

describe("iconsUrl", () => {
  it("is the same for any order", () => {
    expect(iconsUrl("react, git")).toBe("/api/icons?slugs=git,react");
    expect(iconsUrl("git,react")).toBe("/api/icons?slugs=git,react");
  });

  it("is null without icons", () => {
    expect(iconsUrl(" ")).toBeNull();
  });
});
