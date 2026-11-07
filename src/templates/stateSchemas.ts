import "server-only";
import { Result, Schema } from "effect";
import { isContributionYear, LATEST_YEAR } from "@/src/lib/contributionYear";
import { MAX_BACKGROUND_ZOOM, MIN_BACKGROUND_ZOOM } from "@/src/banner/background";
import { CONTENT_ALIGNS } from "@/src/banner/contentPosition";
import { PROFILE_POSITIONS } from "@/src/banner/profilePosition";
import { CONTENT_SIZES, CONTENT_SIZES_OR_FILL } from "@/src/banner/contentSize";
import { BANNER_SIZE_KEYS } from "@/src/lib/sizes";
import { isRepoSelection, MAX_REPOS, REPO_MODES } from "@/src/lib/repoSelection";
import { isGithubUsername } from "@/src/lib/githubUsername";
import { GRID_COLOR_IDS } from "@/src/banner/gridColors";
import { CONTRIBUTION_CELL_SHAPES } from "@/src/banner/cellShape";
import {
  AUTHOR_MAX_LENGTH,
  AUTHOR_PREFIXES,
  isQuoteColor,
  QUOTE_FONT_STYLES,
  QUOTE_FONTS,
  QUOTE_MARKS,
  QUOTE_MAX_LENGTH,
} from "@/src/banner/quoteStyle";
import type { TemplateId } from "@/src/templates/types";
import {
  fieldIssues,
  flag,
  type FieldIssue,
  numberBetween,
  oneOf,
  requiredText,
  text,
  textUpTo,
  textWhere,
} from "@/src/lib/schema";

// Validates settings from the export API and studio links. The input always starts from the
// template's `initialState`, so every key has a value and no defaults are needed here.

const percent = numberBetween(0, 100);
const position = Schema.Struct({ x: percent, y: percent }).annotate({
  message: "Must be an object with x and y",
});

const bannerFields = {
  size: oneOf(BANNER_SIZE_KEYS),
  alignment: oneOf(CONTENT_ALIGNS),
  backgroundImage: Schema.optional(text),
  backgroundPosition: Schema.optional(position),
  backgroundZoom: Schema.optional(numberBetween(MIN_BACKGROUND_ZOOM, MAX_BACKGROUND_ZOOM)),
  backgroundOpacity: Schema.optional(percent),
  /** Set by dragging the content in the preview. */
  contentPosition: Schema.optional(position),
  logoImage: Schema.optional(text),
  logoSize: oneOf(CONTENT_SIZES),
  /** Set by dragging the logo in the preview. */
  logoPosition: Schema.optional(position),
};

const contentSize = oneOf(CONTENT_SIZES);

/** An empty username only gets "Required". */
const githubUsername = requiredText.check(
  Schema.makeFilter((value: string) => value === "" || isGithubUsername(value), {
    message: "Must be a GitHub username",
  }),
);

/** Shared by the GitHub and contribution banners. */
const contributionGridFields = {
  year: textWhere(isContributionYear, `Must be a four-digit year or "${LATEST_YEAR}"`),
  themeId: oneOf(GRID_COLOR_IDS),
  cellShape: oneOf(CONTRIBUTION_CELL_SHAPES),
};

/** Shared by the GitHub and repos banners. */
const profileFields = {
  username: githubUsername,
  showAvatar: flag,
  showDisplayName: flag,
  profilePosition: oneOf(PROFILE_POSITIONS),
};

const quoteColor = textWhere(isQuoteColor, "Unknown color");

const STATE_SCHEMAS = {
  "github-banner": Schema.Struct({
    ...bannerFields,
    ...contributionGridFields,
    ...profileFields,
    showMonthLabels: flag,
    showDayLabels: flag,
    showTotal: flag,
    contentSize,
  }),
  "repos-banner": Schema.Struct({
    ...bannerFields,
    ...profileFields,
    mode: oneOf(REPO_MODES),
    selectedRepos: textWhere(
      isRepoSelection,
      `Must be at most ${MAX_REPOS} repository names, comma-separated`,
    ),
    maxRepos: numberBetween(1, MAX_REPOS),
    showDescription: flag,
    showLanguage: flag,
    showStars: flag,
    showForks: flag,
    contentSize,
  }),
  "contribution-banner": Schema.Struct({
    ...bannerFields,
    ...contributionGridFields,
    username: githubUsername,
    contentSize: oneOf(CONTENT_SIZES_OR_FILL),
  }),
  "quote-banner": Schema.Struct({
    ...bannerFields,
    quote: requiredText.check(textUpTo(QUOTE_MAX_LENGTH)),
    author: text.check(textUpTo(AUTHOR_MAX_LENGTH)),
    contentSize,
    font: oneOf(QUOTE_FONTS),
    fontStyle: oneOf(QUOTE_FONT_STYLES),
    quoteMarks: oneOf(QUOTE_MARKS),
    quoteColor,
    markColor: quoteColor,
    authorColor: quoteColor,
    authorPrefix: oneOf(AUTHOR_PREFIXES),
    authorSize: contentSize,
  }),
} satisfies Record<TemplateId, Schema.Top>;

/** Each template's settings, as its schema checks them. */
export type TemplateSettings = { [K in TemplateId]: (typeof STATE_SCHEMAS)[K]["Type"] };

/** The settings every banner has. */
export type BaseSettings = Schema.Struct<typeof bannerFields>["Type"];

/** The GitHub and repos banners' profile settings. */
export type ProfileSettings = Schema.Struct<typeof profileFields>["Type"];

/** The GitHub and contribution banners' grid settings. */
export type ContributionGridSettings = Schema.Struct<typeof contributionGridFields>["Type"];

/**
 * Checks a template's settings. On failure it returns each bad field as a `state.…` path. Unknown
 * keys are dropped from the result.
 */
export function checkTemplateState<K extends TemplateId>(
  templateId: K,
  state: Record<string, unknown>,
): { ok: true; state: TemplateSettings[K] } | { ok: false; issues: FieldIssue[] } {
  const schemas: { [T in TemplateId]: Schema.Codec<TemplateSettings[T]> } = STATE_SCHEMAS;
  const schema: Schema.Codec<TemplateSettings[K]> = schemas[templateId];
  const decoded = Schema.decodeUnknownResult(schema, { errors: "all" })(state);
  return Result.isSuccess(decoded)
    ? { ok: true, state: decoded.success }
    : { ok: false, issues: fieldIssues(decoded.failure.issue, "state") };
}
