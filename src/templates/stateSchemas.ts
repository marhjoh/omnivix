import "server-only";
import { Result, Schema } from "effect";
import { isContributionYear, LATEST_YEAR } from "@/src/lib/contributionYear";
import { MAX_BACKGROUND_ZOOM, MIN_BACKGROUND_ZOOM } from "@/src/banner/background";
import { CONTENT_ALIGNS } from "@/src/banner/contentAlign";
import { PROFILE_POSITIONS } from "@/src/banner/profilePosition";
import { CONTENT_SIZES, CONTENT_SIZES_OR_FILL } from "@/src/banner/contentSize";
import { BANNER_SIZE_KEYS } from "@/src/lib/sizes";
import { MAX_REPOS, REPO_MODES } from "@/src/lib/repoSelection";
import { THEME_PRESETS } from "@/src/types/theme";
import {
  AUTHOR_PREFIXES,
  isQuoteColor,
  QUOTE_FONT_STYLES,
  QUOTE_FONTS,
  QUOTE_MARKS,
} from "@/src/banner/quoteStyle";
import {
  AUTHOR_MAX_LENGTH,
  CONTRIBUTION_CELL_SHAPES,
  QUOTE_MAX_LENGTH,
} from "@/src/templates/definitions";
import type { TemplateId } from "@/src/types/template";
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

// Server only (see src/lib/schema.ts). Each template's settings, as the export API and studio
// links check them. They're always checked over the template's `initialState`, so every key has
// a value and no defaults are needed here.

const percent = numberBetween(0, 100);
const position = Schema.Struct({ x: percent, y: percent }).annotate({
  message: "Must be an object with x and y",
});

/** Settings every banner has. */
const baseFields = {
  size: oneOf(BANNER_SIZE_KEYS),
  themeId: oneOf(THEME_PRESETS.map((preset) => preset.id)),
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

/** GitHub username, for the banners that load GitHub data. */
const username = requiredText;
const year = textWhere(isContributionYear, `Must be a four-digit year or "${LATEST_YEAR}"`);
const alignment = oneOf(CONTENT_ALIGNS);
const profilePosition = oneOf(PROFILE_POSITIONS);
const contentSize = oneOf(CONTENT_SIZES);
const cellShape = oneOf(CONTRIBUTION_CELL_SHAPES);
/** The quote banner's colors: a named one or a hex code (src/banner/quoteStyle.ts). */
const quoteColor = textWhere(isQuoteColor, "Unknown color");

const STATE_SCHEMAS = {
  "github-banner": Schema.Struct({
    ...baseFields,
    username,
    year,
    showMonthLabels: flag,
    showDayLabels: flag,
    showTotal: flag,
    showAvatar: flag,
    showDisplayName: flag,
    profilePosition,
    alignment,
    contentSize,
    cellShape,
  }),
  "repos-banner": Schema.Struct({
    ...baseFields,
    username,
    showAvatar: flag,
    showDisplayName: flag,
    profilePosition,
    alignment,
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
    ...baseFields,
    username,
    alignment,
    contentSize: oneOf(CONTENT_SIZES_OR_FILL),
    year,
    cellShape,
  }),
  "quote-banner": Schema.Struct({
    ...baseFields,
    quote: requiredText.check(textUpTo(QUOTE_MAX_LENGTH)),
    author: text.check(textUpTo(AUTHOR_MAX_LENGTH)),
    alignment,
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

const DECODERS = Object.fromEntries(
  Object.entries(STATE_SCHEMAS).map(([id, schema]) => [
    id,
    Schema.decodeUnknownResult(schema as Schema.Codec<Record<string, unknown>>, { errors: "all" }),
  ]),
) as Record<
  TemplateId,
  (input: unknown) => Result.Result<Record<string, unknown>, Schema.SchemaError>
>;

/**
 * Checks a template's settings: the checked settings, or each field that failed (as `state.…`
 * paths). Keys the template doesn't know are left out of the result.
 */
export function checkTemplateState(
  templateId: TemplateId,
  state: Record<string, unknown>,
): { ok: true; state: Record<string, unknown> } | { ok: false; issues: FieldIssue[] } {
  const decoded = DECODERS[templateId](state);
  return Result.isSuccess(decoded)
    ? { ok: true, state: decoded.success }
    : { ok: false, issues: fieldIssues(decoded.failure.issue, "state") };
}
