import { describe, expect, it } from "vitest";
import { searchIcons } from "./searchIcons";

const catalog = [
  { slug: "nextdotjs", title: "Next.js", hex: "000000" },
  { slug: "nextcloud", title: "Nextcloud", hex: "0082C9" },
  { slug: "react", title: "React", hex: "61DAFB" },
  { slug: "reactquery", title: "React Query", hex: "FF4154" },
  { slug: "preact", title: "Preact", hex: "673AB8" },
];

const slugs = (query: string) => searchIcons(catalog, query).map((icon) => icon.slug);

describe("searchIcons", () => {
  it("puts an exact name first, then names that start with the query", () => {
    expect(slugs("react")).toEqual(["react", "reactquery", "preact"]);
  });

  it("ignores case, spaces and dots", () => {
    expect(slugs("NextJS")).toEqual(["nextdotjs"]);
    expect(slugs("next.js")).toEqual(["nextdotjs"]);
  });

  it("matches slugs", () => {
    expect(slugs("dotjs")).toEqual(["nextdotjs"]);
  });

  it("finds nothing for an empty query", () => {
    expect(slugs("  ")).toEqual([]);
  });
});
