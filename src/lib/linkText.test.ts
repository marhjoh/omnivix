import { describe, expect, it } from "vitest";
import { linkText } from "./linkText";

describe("linkText", () => {
  it("drops https:// from short links", () => {
    expect(linkText("https://github.com/settings/profile")).toBe("github.com/settings/profile");
  });

  it("shows only the domain of long links", () => {
    expect(
      linkText(
        "https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions",
      ),
    ).toBe("docs.github.com");
  });
});
