import "server-only";
import { Result, Schema } from "effect";
import { isContributionYear, LATEST_YEAR } from "@/src/lib/contributionYear";
import { MAX_BACKGROUND_ZOOM, MIN_BACKGROUND_ZOOM } from "@/src/banner/background";
import { CONTENT_ALIGNS } from "@/src/banner/contentPosition";
import { PROFILE_POSITIONS } from "@/src/banner/profilePosition";
import { CONTENT_SIZES, CONTENT_SIZES_OR_FILL } from "@/src/banner/contentSize";
import { BANNER_SIZE_KEYS } from "@/src/lib/sizes";
import { MAX_REPOS, REPO_MODES } from "@/src/lib/repoSelection";
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

// Each template's settings, as the export API and studio links check them. They're always checked over the template's `initialState`, so every key has
// a value and no defaults are needed here.

const percent = numberBetween(0, 100);
const position = Schema.Struct({ x: percent, y: percent }).annotate({
  message: "Must be an object with x and y",
});

/** Settings every banner has. */
const bannerFields = {
  size: oneOf(BANNER_SIZE_KEYS),
  alignment: oneOf(CONTENT_ALIGNS),
  backgroundImage: Schema.optional(text),
  backgroundPosition: Schema.optional(position),
  backgroundZoom: Schema.optional(numberBetween(MIN_BACKGROUND_ZOOM, MAX_BACKGROUND_ZOOM)),
  /** Set by dragging the content in the preview; see `src/banner/contentPosition.ts`. */
  contentPosition: Schema.optional(position),
  logoImage: Schema.optional(text),
  logoSize: oneOf(CONTENT_SIZES),
  /** Set by dragging the logo in the preview; see `src/banner/logo.ts`. */
  logoPosition: Schema.optional(position),
};

const contentSize = oneOf(CONTENT_SIZES);

/** The contribution grid's settings (GitHub and contribution banners). */
const contributionGridFields = {
  year: textWhere(isContributionYear, `Must be a four-digit year or "${LATEST_YEAR}"`),
  themeId: oneOf(GRID_COLOR_IDS),
  cellShape: oneOf(CONTRIBUTION_CELL_SHAPES),
};

/** The GitHub profile above the content (GitHub and repos banners). */
const profileFields = {
  username: requiredText,
  showAvatar: flag,
  showDisplayName: flag,
  profilePosition: oneOf(PROFILE_POSITIONS),
};

/** The quote banner's colors: a named one or a hex code (src/banner/quoteStyle.ts). */
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
    selectedRepos: text,
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
    username: requiredText,
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

/**
 * Checks a template's settings: the checked settings, or each field that failed (as `state.…`
 * paths). Keys the template doesn't know are left out of the result.
 */
export function checkTemplateState(
  templateId: TemplateId,
  state: Record<string, unknown>,
): { ok: true; state: Record<string, unknown> } | { ok: false; issues: FieldIssue[] } {
  const schema = STATE_SCHEMAS[templateId] as Schema.Codec<Record<string, unknown>>;
  const decoded = Schema.decodeUnknownResult(schema, { errors: "all" })(state);
  return Result.isSuccess(decoded)
    ? { ok: true, state: decoded.success }
    : { ok: false, issues: fieldIssues(decoded.failure.issue, "state") };
}
