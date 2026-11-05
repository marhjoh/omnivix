import { CONTENT_ALIGN_OPTIONS, type ContentAlign } from "@/src/banner/contentAlign";
import { PROFILE_POSITION_OPTIONS, type ProfilePosition } from "@/src/banner/profilePosition";
import {
  CONTENT_SIZE_OPTIONS,
  DEFAULT_CONTENT_SIZE,
  type ContentSize,
  type ContentSizeOrFill,
} from "@/src/banner/contentSize";
import { oneOfOr } from "@/src/lib/isOneOf";
import { DEFAULT_BANNER_SIZE } from "@/src/lib/sizes";
import { BannerSize, EditorFieldSchema, TemplateDefinition } from "@/src/types/template";
import { MAX_REPOS, REPO_MODES, type RepoMode } from "@/src/lib/repoSelection";
import { currentYear } from "@/src/lib/contributionYear";
import { DEFAULT_LOGO_SIZE } from "@/src/banner/logo";
import {
  DEFAULT_QUOTE_STYLE,
  QUOTE_COLOR_OPTIONS,
  AUTHOR_PREFIX_OPTIONS,
  type AuthorPrefix,
  QUOTE_FONT_OPTIONS,
  QUOTE_FONT_STYLE_OPTIONS,
  QUOTE_MARKS_OPTIONS,
  type QuoteFont,
  type QuoteFontStyle,
  type QuoteMarks,
} from "@/src/banner/quoteStyle";

/** GitHub + contribution banner: sidebar options and ContributionGrid. Settings rules: stateSchemas.ts. */
export const CONTRIBUTION_CELL_SHAPES = ["rounded", "square", "circle"] as const;

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
  return oneOfOr(CONTRIBUTION_CELL_SHAPES, raw, "rounded");
}

/** A post's length: still readable on the 4:1 banner at the smallest text size. */
export const QUOTE_MAX_LENGTH = 280;
export const AUTHOR_MAX_LENGTH = 60;

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

/** Horizontal placement of the content (its x in `contentPosition`). */
const alignmentField: EditorFieldSchema = {
  key: "alignment",
  label: "Alignment",
  type: "select",
  options: CONTENT_ALIGN_OPTIONS,
};

/** Which side of the content the avatar and name sit on (GitHub and repos banners). */
const profilePositionField: EditorFieldSchema = {
  key: "profilePosition",
  label: "Profile position",
  type: "select",
  options: PROFILE_POSITION_OPTIONS,
};

/** See `src/banner/contentSize.ts`. */
const contentSizeField: EditorFieldSchema = {
  key: "contentSize",
  label: "Content size",
  type: "select",
  options: CONTENT_SIZE_OPTIONS,
};

/** GitHub and contribution banners: the contribution grid's cells. */
const cellShapeField: EditorFieldSchema = {
  key: "cellShape",
  label: "Cell shape",
  type: "select",
  options: CONTRIBUTION_CELL_SHAPE_OPTIONS,
};

export const githubBannerDefinition: TemplateDefinition<
  {
    username: string;
    year: string;
    showMonthLabels: boolean;
    showDayLabels: boolean;
    showTotal: boolean;
    showAvatar: boolean;
    showDisplayName: boolean;
    profilePosition: ProfilePosition;
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
    defaultSize: DEFAULT_BANNER_SIZE,
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
  initialState: {
    ...logoInitialState,
    username: "",
    themeId: "default",
    size: DEFAULT_BANNER_SIZE,
    year: String(currentYear()),
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
    profilePosition: ProfilePosition;
    alignment: ContentAlign;
    mode: RepoMode;
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
    defaultSize: DEFAULT_BANNER_SIZE,
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
      options: REPO_MODES.map((value) => ({
        label: value[0].toUpperCase() + value.slice(1),
        value,
      })),
    },
    { key: "selectedRepos", label: "Repositories", type: "repoMultiSelect" },
    { key: "maxRepos", label: "Amount", type: "range", min: 1, max: MAX_REPOS, step: 1 },
    { key: "showDescription", label: "Description", type: "toggle" },
    { key: "showLanguage", label: "Language", type: "toggle" },
    { key: "showStars", label: "Stars", type: "toggle" },
    { key: "showForks", label: "Forks", type: "toggle" },
    ...logoFields,
  ],
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
    size: DEFAULT_BANNER_SIZE,
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
    defaultSize: DEFAULT_BANNER_SIZE,
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
  initialState: {
    ...logoInitialState,
    username: "",
    alignment: "center",
    contentSize: DEFAULT_CONTENT_SIZE,
    cellShape: "rounded",
    themeId: "default",
    size: DEFAULT_BANNER_SIZE,
    year: String(currentYear()),
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
    defaultSize: DEFAULT_BANNER_SIZE,
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
    { key: "authorSize", label: "Author size", type: "select", options: CONTENT_SIZE_OPTIONS },
    ...logoFields,
  ],
  initialState: {
    ...logoInitialState,
    ...DEFAULT_QUOTE_STYLE,
    authorSize: "m",
    quote: "Build once, ship everywhere.",
    author: "Omnivix",
    alignment: "center",
    contentSize: "m",
    themeId: "default",
    size: DEFAULT_BANNER_SIZE,
  },
};
