/** The intro banner's links, in the order its footer shows them. */
export const INTRO_LINKS = [
  { key: "github", label: "GitHub" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "x", label: "X" },
  { key: "website", label: "Website" },
  { key: "email", label: "Email" },
] as const;

export type IntroLinkKey = (typeof INTRO_LINKS)[number]["key"];

export const NAME_MAX_LENGTH = 40;
export const HEADLINE_MAX_LENGTH = 80;
export const TAGLINE_MAX_LENGTH = 140;
export const LINK_MAX_LENGTH = 60;

/** The intro banner's starting tech row, as Simple Icons slugs. */
export const DEFAULT_INTRO_ICONS =
  "typescript, python, react, nextdotjs, flutter, fastapi, tailwindcss, docker";

/** A link as the footer shows it, without `https://`, `www.` or a trailing slash. */
export function linkText(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
}
