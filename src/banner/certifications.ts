/** A certification on the certifications banner. Text fields can be empty while it's being typed. */
export interface Certification {
  name: string;
  /** Who issued it, e.g. "Google Cloud". Picked from Simple Icons or typed in. */
  issuer: string;
  /** Up to four digits. */
  year: string;
  /** The issuer's Simple Icons slug, or empty for none. The banner then draws an award icon. */
  slug: string;
}

export const MAX_CERTIFICATIONS = 8;
export const CERTIFICATION_NAME_MAX_LENGTH = 60;
export const ISSUER_MAX_LENGTH = 40;

export const MIN_BADGES_PER_ROW = 1;
export const MAX_BADGES_PER_ROW = 4;
export const DEFAULT_BADGES_PER_ROW = 2;

const ENTRY_SEPARATOR = ";";
const FIELD_SEPARATOR = "|";

/** Simple Icons slugs, as in iconSelection.ts. */
const SLUG = /^[a-z0-9_]{0,50}$/;
const YEAR = /^\d{0,4}$/;

/** Removes what would break the encoding: the separators and line breaks. */
export function cleanCertificationText(text: string): string {
  return text.replace(/[;|\r\n]/g, "");
}

/** Keeps the digits, at most four. */
export function cleanYear(text: string): string {
  return text.replace(/\D/g, "").slice(0, 4);
}

/**
 * The `certifications` setting: certifications joined by `;`, each as `name|issuer|year|slug`. It
 * stays readable in a studio link, e.g. `Professional Cloud Architect|Google Cloud|2025|googlecloud`.
 */
export function encodeCertifications(certifications: readonly Certification[]): string {
  return certifications
    .map(({ name, issuer, year, slug }) => [name, issuer, year, slug].join(FIELD_SEPARATOR))
    .join(ENTRY_SEPARATOR);
}

function entriesOf(value: string): string[][] {
  return value === ""
    ? []
    : value.split(ENTRY_SEPARATOR).map((entry) => entry.split(FIELD_SEPARATOR));
}

/** The certifications in a setting. Fields past the fourth are ignored, missing ones are empty. */
export function parseCertifications(value: string): Certification[] {
  return entriesOf(value).map(([name = "", issuer = "", year = "", slug = ""]) => ({
    name,
    issuer,
    year,
    slug,
  }));
}

/** Certifications with a name, the ones the banner draws. */
export function namedCertifications(value: string): Certification[] {
  return parseCertifications(value).filter((certification) => certification.name.trim() !== "");
}

/**
 * True for a setting the studio could have saved: at most MAX_CERTIFICATIONS, each with four
 * fields that fit their limits. Empty names are allowed, because a new row starts empty.
 */
export function isCertifications(value: string): boolean {
  const entries = entriesOf(value);
  return (
    entries.length <= MAX_CERTIFICATIONS &&
    entries.every((fields) => {
      const [name, issuer, year, slug] = fields;
      return (
        fields.length === 4 &&
        !/[\r\n]/.test(name + issuer) &&
        name.length <= CERTIFICATION_NAME_MAX_LENGTH &&
        issuer.length <= ISSUER_MAX_LENGTH &&
        YEAR.test(year) &&
        SLUG.test(slug)
      );
    })
  );
}

/**
 * The issuers' Simple Icons slugs, each once, as an `icons` setting. Rows without a name are
 * included, so the banner and the sidebar's rows share one request.
 */
export function certificationIcons(value: string): string {
  const slugs = parseCertifications(value).map((certification) => certification.slug);
  return [...new Set(slugs.filter(Boolean))].join(", ");
}

export const DEFAULT_CERTIFICATIONS = encodeCertifications([
  {
    name: "Professional Cloud Architect",
    issuer: "Google Cloud",
    year: "2025",
    slug: "googlecloud",
  },
  {
    name: "Certified Kubernetes Administrator",
    issuer: "Linux Foundation",
    year: "2025",
    slug: "linuxfoundation",
  },
  { name: "Terraform Associate", issuer: "HashiCorp", year: "2024", slug: "hashicorp" },
  { name: "Certified System Administrator", issuer: "Red Hat", year: "2023", slug: "redhat" },
]);
