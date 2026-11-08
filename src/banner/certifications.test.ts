import { describe, expect, it } from "vitest";
import {
  certificationIcons,
  cleanCertificationText,
  cleanYear,
  DEFAULT_CERTIFICATIONS,
  encodeCertifications,
  isCertifications,
  MAX_CERTIFICATIONS,
  namedCertifications,
  parseCertifications,
  type Certification,
} from "./certifications";

const certifications: Certification[] = [
  { name: "Terraform Associate", issuer: "HashiCorp", year: "2024", slug: "hashicorp" },
  { name: "Solutions Architect, Associate", issuer: "AWS", year: "", slug: "" },
  { name: "", issuer: "", year: "", slug: "" },
];

describe("encodeCertifications", () => {
  it("round-trips through parseCertifications, empty rows included", () => {
    const value = encodeCertifications(certifications);
    expect(value).toBe(
      "Terraform Associate|HashiCorp|2024|hashicorp;Solutions Architect, Associate|AWS||;|||",
    );
    expect(parseCertifications(value)).toEqual(certifications);
    expect(isCertifications(value)).toBe(true);
  });

  it("encodes no certifications as an empty setting", () => {
    expect(encodeCertifications([])).toBe("");
    expect(parseCertifications("")).toEqual([]);
    expect(isCertifications("")).toBe(true);
  });
});

describe("isCertifications", () => {
  it("accepts the default", () => {
    expect(isCertifications(DEFAULT_CERTIFICATIONS)).toBe(true);
  });

  it.each([
    ["too few fields", "CKA|Linux Foundation"],
    ["too many fields", "CKA|Linux Foundation|2024|linuxfoundation|extra"],
    ["a year that isn't digits", "CKA||24a|"],
    ["a year over four digits", "CKA||20245|"],
    ["a slug Simple Icons can't have", "CKA|||Linux-Foundation"],
    ["a line break", "CKA\nCKAD|||"],
    ["a long name", `${"a".repeat(61)}|||`],
    ["a long issuer", `CKA|${"a".repeat(41)}||`],
    [
      "too many certifications",
      Array(MAX_CERTIFICATIONS + 1)
        .fill("CKA|||")
        .join(";"),
    ],
  ])("rejects %s", (_, value) => {
    expect(isCertifications(value)).toBe(false);
  });
});

describe("namedCertifications", () => {
  it("leaves out rows without a name", () => {
    const value = encodeCertifications([...certifications, { ...certifications[2], name: "  " }]);
    expect(namedCertifications(value).map((c) => c.name)).toEqual([
      "Terraform Associate",
      "Solutions Architect, Associate",
    ]);
  });
});

describe("certificationIcons", () => {
  it("lists each issuer's slug once", () => {
    const value = encodeCertifications([
      ...certifications,
      { name: "Terraform Professional", issuer: "HashiCorp", year: "", slug: "hashicorp" },
      { name: "", issuer: "Google Cloud", year: "", slug: "googlecloud" },
    ]);
    expect(certificationIcons(value)).toBe("hashicorp, googlecloud");
  });
});

describe("cleaning typed text", () => {
  it("drops the separators and line breaks", () => {
    expect(cleanCertificationText("CKA; CKAD | 2\nyears")).toBe("CKA CKAD  2years");
  });

  it("keeps a year's first four digits", () => {
    expect(cleanYear("2024-25")).toBe("2024");
  });
});
