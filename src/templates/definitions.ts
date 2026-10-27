import { z } from "zod";
import { MAX_BACKGROUND_ZOOM, MIN_BACKGROUND_ZOOM } from "@/src/banner/background";
import {
  CONTENT_ALIGN_OPTIONS,
  CONTENT_ALIGNS,
  type ContentAlign,
} from "@/src/banner/contentAlign";
import {
  CONTENT_SIZE_OPTIONS,
  CONTENT_SIZES,
  CONTENT_SIZES_OR_FILL,
  DEFAULT_CONTENT_SIZE,
  type ContentSize,
  type ContentSizeOrFill,
} from "@/src/banner/contentSize";
import { isOneOf } from "@/src/lib/isOneOf";
import { BANNER_SIZE_KEYS } from "@/src/lib/sizes";
import { BannerSize, EditorFieldSchema, TemplateDefinition } from "@/src/types/template";
import { MAX_REPOS } from "@/src/lib/repoSelection";
import { THEME_PRESETS } from "@/src/types/theme";
import { DEFAULT_LOGO_SIZE } from "@/src/banner/logo";
import { MAX_AUTHOR_SPACE } from "@/src/banner/authorPosition";
import {
  DEFAULT_QUOTE_STYLE,
  QUOTE_COLOR_OPTIONS,
  AUTHOR_PREFIX_OPTIONS,
  AUTHOR_PREFIXES,
  type AuthorPrefix,
  isQuoteColor,
  QUOTE_FONT_OPTIONS,
  QUOTE_FONT_STYLE_OPTIONS,
  QUOTE_FONT_STYLES,
  QUOTE_FONTS,
  QUOTE_MARKS,
  QUOTE_MARKS_OPTIONS,
  type QuoteFont,
  type QuoteFontStyle,
  type QuoteMarks,
} from "@/src/banner/quoteStyle";

/** GitHub + contribution banner: schema, sidebar options, Zod, and ContributionGrid. */
const CONTRIBUTION_CELL_SHAPES = ["rounded", "square", "circle"] as const;

export type ContributionCellShape = (typeof CONTRIBUTION_CELL_SHAPES)[number];

const CONTRIBUTION_CELL_SHAPE_LABELS: Record<ContributionCellShape, string> = {
  rounded: "Rounded",
  square: "Square",
  circle: "Circle",
};

const CONTRIBUTION_CELL_SHAPE_OPTIONS: Array<{
  label: string;
  value: ContributionCellShape;
}> = CONTRIBUTION_CELL_SHAPES.map((value) => ({
  label: CONTRIBUTION_CELL_SHAPE_LABELS[value],
  value,
}));

export function contributionCellShapeFromState(raw: unknown): ContributionCellShape {
  return isOneOf(CONTRIBUTION_CELL_SHAPES, raw) ? raw : "rounded";
}

const percent = z.number().min(0).max(100);

/** A post's length: still readable on the 4:1 banner at the smallest text size. */
const QUOTE_MAX_LENGTH = 280;
const AUTHOR_MAX_LENGTH = 60;

const baseState = z.object({
  size: z.enum(BANNER_SIZE_KEYS),
  themeId: z.enum(THEME_PRESETS.map((preset) => preset.id)),
  backgroundImage: z.string().optional(),
  backgroundPosition: z.object({ x: percent, y: percent }).optional(),
  backgroundZoom: z.number().min(MIN_BACKGROUND_ZOOM).max(MAX_BACKGROUND_ZOOM).optional(),
  /** Set by dragging the content in the preview; see `src/banner/contentPosition.ts`. */
  contentPosition: z.object({ x: percent, y: percent }).optional(),
  logoImage: z.string().optional(),
  logoSize: z.enum(CONTENT_SIZES).default(DEFAULT_LOGO_SIZE),
  /** Set by dragging the logo in the preview; see `src/banner/logo.ts`. */
  logoPosition: z.object({ x: percent, y: percent }).optional(),
});

/** Every banner can have a logo; see `src/banner/logo.ts`. */
const logoFields: EditorFieldSchema[] = [
  { key: "logoImage", label: "Logo", type: "logoPicker" },
  { key: "logoSize", label: "Logo size", type: "select", options: CONTENT_SIZE_OPTIONS },
];

/** The logo settings every template's state has. */
type LogoState = {
  logoImage?: string;
  logoSize: ContentSize;
};

const logoInitialState: LogoState = { logoSize: DEFAULT_LOGO_SIZE };

/** GitHub username, for the banners that load GitHub data. */
const usernameState = z.string().min(1, "Required");

/**
 * Horizontal placement of the content (its x in `contentPosition`); in the quote banner also the
 * text alignment.
 */
const alignmentField: EditorFieldSchema = {
  key: "alignment",
  label: "Alignment",
  type: "select",
  options: CONTENT_ALIGN_OPTIONS,
};

const alignmentState = z.enum(CONTENT_ALIGNS).default("center");

/** Which side of the content the avatar and name sit on (GitHub and repos banners). */
const profilePositionField: EditorFieldSchema = {
  key: "profilePosition",
  label: "Profile position",
  type: "select",
  options: [
    { label: "Left", value: "left" },
    { label: "Right", value: "right" },
  ],
};

const profilePositionState = z.enum(["left", "right"]).default("left");

/** See `src/banner/contentSize.ts`. */
const contentSizeField: EditorFieldSchema = {
  key: "contentSize",
  label: "Content size",
  type: "select",
  options: CONTENT_SIZE_OPTIONS,
};

const contentSizeState = z.enum(CONTENT_SIZES);

/** The quote banner's colors: a named one or a hex code (src/banner/quoteStyle.ts). */
const quoteColorState = z.string().refine(isQuoteColor, "Unknown color");

/** GitHub and contribution banners: the contribution grid's cells. */
const cellShapeField: EditorFieldSchema = {
  key: "cellShape",
  label: "Cell shape",
  type: "select",
  options: CONTRIBUTION_CELL_SHAPE_OPTIONS,
};
const cellShapeState = z.enum(CONTRIBUTION_CELL_SHAPES).default("rounded");

const yearState = z.string().default(String(new Date().getFullYear()));

export const githubBannerDefinition: TemplateDefinition<
  {
    username: string;
    year: string;
    showMonthLabels: boolean;
    showDayLabels: boolean;
    showTotal: boolean;
    showAvatar: boolean;
    showDisplayName: boolean;
    profilePosition: "left" | "right";
    alignment: ContentAlign;
    contentSize: ContentSize;
    cellShape: ContributionCellShape;
    size: BannerSize;
    themeId: string;
    backgroundImage?: string;
  } & LogoState
> = {
  meta: {
    id: "github-banner",
    title: "GitHub Banner",
    description: "Username, avatar, and contributions.",
    defaultSize: "wide",
    needsUsername: true,
    githubData: ["user", "contributions"],
  },
  schema: [
    { key: "size", label: "Type", type: "sizeSelect" },
    { key: "themeId", label: "Theme", type: "select" },
    { key: "backgroundImage", label: "Background", type: "backgroundPicker" },
    { key: "year", label: "Year", type: "select" },
    alignmentField,
    profilePositionField,
    contentSizeField,
    cellShapeField,
    { key: "showAvatar", label: "Profile photo", type: "toggle" },
    { key: "showDisplayName", label: "Full name", type: "toggle" },
    { key: "showMonthLabels", label: "Months", type: "toggle" },
    { key: "showDayLabels", label: "Weekdays", type: "toggle" },
    { key: "showTotal", label: "Contributions", type: "toggle" },
    ...logoFields,
  ],
  stateSchema: baseState.extend({
    username: usernameState,
    year: yearState,
    showMonthLabels: z.boolean().default(true),
    showDayLabels: z.boolean().default(true),
    showTotal: z.boolean().default(true),
    showAvatar: z.boolean().default(true),
    showDisplayName: z.boolean().default(false),
    profilePosition: profilePositionState,
    alignment: alignmentState,
    contentSize: contentSizeState,
    cellShape: cellShapeState,
  }),
  initialState: {
    ...logoInitialState,
    username: "",
    themeId: "default",
    size: "wide",
    year: String(new Date().getFullYear()),
    showMonthLabels: true,
    showDayLabels: true,
    showTotal: true,
    showAvatar: true,
    showDisplayName: false,
    profilePosition: "left",
    alignment: "center",
    contentSize: DEFAULT_CONTENT_SIZE,
    cellShape: "rounded",
  },
};

export const reposBannerDefinition: TemplateDefinition<
  {
    username: string;
    showAvatar: boolean;
    showDisplayName: boolean;
    profilePosition: "left" | "right";
    alignment: ContentAlign;
    mode: "pinned" | "selected";
    selectedRepos: string;
    maxRepos: number;
    showDescription: boolean;
    showLanguage: boolean;
    showStars: boolean;
    showForks: boolean;
    contentSize: ContentSize;
    size: BannerSize;
    themeId: string;
    backgroundImage?: string;
  } & LogoState
> = {
  meta: {
    id: "repos-banner",
    title: "Repos Banner",
    description: "Languages, stars, and forks.",
    defaultSize: "wide",
    needsUsername: true,
    githubData: ["user", "repos"],
  },
  schema: [
    { key: "size", label: "Type", type: "sizeSelect" },
    { key: "backgroundImage", label: "Background", type: "backgroundPicker" },
    alignmentField,
    profilePositionField,
    contentSizeField,
    { key: "showAvatar", label: "Profile photo", type: "toggle" },
    { key: "showDisplayName", label: "Full name", type: "toggle" },
    {
      key: "mode",
      label: "Mode",
      type: "select",
      options: [
        { label: "Pinned", value: "pinned" },
        { label: "Selected", value: "selected" },
      ],
    },
    { key: "selectedRepos", label: "Repositories", type: "repoMultiSelect" },
    { key: "maxRepos", label: "Amount", type: "range", min: 1, max: MAX_REPOS, step: 1 },
    { key: "showDescription", label: "Description", type: "toggle" },
    { key: "showLanguage", label: "Language", type: "toggle" },
    { key: "showStars", label: "Stars", type: "toggle" },
    { key: "showForks", label: "Forks", type: "toggle" },
    ...logoFields,
  ],
  stateSchema: baseState.extend({
    username: usernameState,
    showAvatar: z.boolean().default(true),
    showDisplayName: z.boolean().default(false),
    profilePosition: profilePositionState,
    alignment: alignmentState,
    mode: z.enum(["pinned", "selected"]),
    selectedRepos: z.string().default(""),
    maxRepos: z.number().min(1).max(MAX_REPOS).default(MAX_REPOS),
    showDescription: z.boolean().default(true),
    showLanguage: z.boolean().default(true),
    showStars: z.boolean().default(true),
    showForks: z.boolean().default(true),
    contentSize: contentSizeState,
  }),
  initialState: {
    ...logoInitialState,
    username: "",
    showAvatar: true,
    showDisplayName: false,
    profilePosition: "left",
    alignment: "center",
    mode: "pinned",
    selectedRepos: "",
    maxRepos: MAX_REPOS,
    showDescription: true,
    showLanguage: true,
    showStars: true,
    showForks: true,
    contentSize: DEFAULT_CONTENT_SIZE,
    themeId: "default",
    size: "wide",
  },
};

export const contributionBannerDefinition: TemplateDefinition<
  {
    username: string;
    year: string;
    alignment: ContentAlign;
    contentSize: ContentSizeOrFill;
    cellShape: ContributionCellShape;
    size: BannerSize;
    themeId: string;
    backgroundImage?: string;
  } & LogoState
> = {
  meta: {
    id: "contribution-banner",
    title: "Contribution Banner",
    description: "Contribution heatmap.",
    defaultSize: "wide",
    needsUsername: true,
    githubData: ["contributions"],
  },
  schema: [
    { key: "size", label: "Type", type: "sizeSelect" },
    { key: "themeId", label: "Theme", type: "select" },
    { key: "backgroundImage", label: "Background", type: "backgroundPicker" },
    { key: "year", label: "Year", type: "select" },
    alignmentField,
    { ...contentSizeField, options: [...CONTENT_SIZE_OPTIONS, { label: "Fill", value: "fill" }] },
    cellShapeField,
    ...logoFields,
  ],
  stateSchema: baseState.extend({
    username: usernameState,
    alignment: alignmentState,
    contentSize: z.enum(CONTENT_SIZES_OR_FILL),
    year: yearState,
    cellShape: cellShapeState,
  }),
  initialState: {
    ...logoInitialState,
    username: "",
    alignment: "center",
    contentSize: DEFAULT_CONTENT_SIZE,
    cellShape: "rounded",
    themeId: "default",
    size: "wide",
    year: String(new Date().getFullYear()),
  },
};

export const quoteBannerDefinition: TemplateDefinition<
  {
    quote: string;
    author: string;
    alignment: ContentAlign;
    contentSize: ContentSize;
    font: QuoteFont;
    fontStyle: QuoteFontStyle;
    quoteMarks: QuoteMarks;
    /** A named color or a hex code. */
    quoteColor: string;
    markColor: string;
    authorColor: string;
    authorPrefix: AuthorPrefix;
    authorSize: ContentSize;
    size: BannerSize;
    themeId: string;
    backgroundImage?: string;
  } & LogoState
> = {
  meta: {
    id: "quote-banner",
    title: "Quote Banner",
    description: "Typographic quotes.",
    defaultSize: "wide",
    needsUsername: false,
    githubData: [],
  },
  schema: [
    { key: "size", label: "Type", type: "sizeSelect" },
    { key: "backgroundImage", label: "Background", type: "backgroundPicker" },
    alignmentField,
    { ...contentSizeField, label: "Quote size" },
    { key: "font", label: "Font", type: "select", options: QUOTE_FONT_OPTIONS },
    { key: "fontStyle", label: "Font style", type: "select", options: QUOTE_FONT_STYLE_OPTIONS },
    { key: "quoteMarks", label: "Quote marks", type: "select", options: QUOTE_MARKS_OPTIONS },
    { key: "quoteColor", label: "Quote color", type: "colorPicker", options: QUOTE_COLOR_OPTIONS },
    { key: "markColor", label: "Mark color", type: "colorPicker", options: QUOTE_COLOR_OPTIONS },
    {
      key: "authorColor",
      label: "Author color",
      type: "colorPicker",
      options: QUOTE_COLOR_OPTIONS,
    },
    {
      key: "quote",
      label: "Quote text",
      type: "textarea",
      required: true,
      maxLength: QUOTE_MAX_LENGTH,
    },
    { key: "author", label: "Author", type: "text", maxLength: AUTHOR_MAX_LENGTH },
    { key: "authorPrefix", label: "Author prefix", type: "select", options: AUTHOR_PREFIX_OPTIONS },
    { key: "authorPosition", label: "Author position", type: "authorPosition" },
    { key: "authorSize", label: "Author size", type: "select", options: CONTENT_SIZE_OPTIONS },
    ...logoFields,
  ],
  stateSchema: baseState.extend({
    quote: z.string().min(1, "Required").max(QUOTE_MAX_LENGTH),
    author: z.string().max(AUTHOR_MAX_LENGTH).default(""),
    alignment: alignmentState,
    contentSize: contentSizeState,
    font: z.enum(QUOTE_FONTS).default(DEFAULT_QUOTE_STYLE.font),
    fontStyle: z.enum(QUOTE_FONT_STYLES).default(DEFAULT_QUOTE_STYLE.fontStyle),
    quoteMarks: z.enum(QUOTE_MARKS).default(DEFAULT_QUOTE_STYLE.quoteMarks),
    quoteColor: quoteColorState.default(DEFAULT_QUOTE_STYLE.quoteColor),
    markColor: quoteColorState.default(DEFAULT_QUOTE_STYLE.markColor),
    authorColor: quoteColorState.default(DEFAULT_QUOTE_STYLE.authorColor),
    authorPrefix: z.enum(AUTHOR_PREFIXES).default(DEFAULT_QUOTE_STYLE.authorPrefix),
    authorSize: contentSizeState.default("m"),
    /** Set once the author is dragged; until then it's lined up like the quote. */
    authorPosition: z.object({ x: percent, y: z.number().min(0).max(MAX_AUTHOR_SPACE) }).optional(),
  }),
  initialState: {
    ...logoInitialState,
    ...DEFAULT_QUOTE_STYLE,
    authorSize: "m",
    quote: "Build once, ship everywhere.",
    author: "Omnivix",
    alignment: "center",
    contentSize: "m",
    themeId: "default",
    size: "wide",
  },
};
