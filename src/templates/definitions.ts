import {
  CONTENT_ALIGN_OPTIONS,
  DEFAULT_CONTENT_ALIGN,
  type ContentAlign,
} from "@/src/banner/contentPosition";
import { PROFILE_POSITION_OPTIONS, type ProfilePosition } from "@/src/banner/profilePosition";
import {
  CONTENT_SIZE_OPTIONS,
  DEFAULT_CONTENT_SIZE,
  type ContentSize,
  type ContentSizeOrFill,
} from "@/src/banner/contentSize";
import {
  CONTRIBUTION_CELL_SHAPE_OPTIONS,
  DEFAULT_CELL_SHAPE,
  type ContributionCellShape,
} from "@/src/banner/cellShape";
import { DEFAULT_GRID_COLORS_ID, type GridColorsId } from "@/src/banner/gridColors";
import { DEFAULT_BANNER_SIZE, type BannerSize } from "@/src/lib/sizes";
import type { EditorFieldSchema, TemplateDefinition } from "@/src/templates/types";
import { MAX_REPOS, REPO_MODES, type RepoMode } from "@/src/lib/repoSelection";
import { currentYear } from "@/src/lib/contributionYear";
import { DEFAULT_LOGO_SIZE } from "@/src/banner/logo";
import {
  AUTHOR_MAX_LENGTH,
  DEFAULT_QUOTE_STYLE,
  QUOTE_COLOR_OPTIONS,
  QUOTE_MAX_LENGTH,
  AUTHOR_PREFIX_OPTIONS,
  type AuthorPrefix,
  QUOTE_FONT_OPTIONS,
  QUOTE_FONT_STYLE_OPTIONS,
  QUOTE_MARKS_OPTIONS,
  type QuoteFont,
  type QuoteFontStyle,
  type QuoteMarks,
} from "@/src/banner/quoteStyle";

// The sidebar shows each template's fields in its `schema` order. Settings rules: stateSchemas.ts.

/** Settings every banner has: its size, background, logo and alignment. */
type BannerState = {
  size: BannerSize;
  backgroundImage?: string;
  logoImage?: string;
  logoSize: ContentSize;
  alignment: ContentAlign;
};

const bannerInitialState = {
  size: DEFAULT_BANNER_SIZE,
  logoSize: DEFAULT_LOGO_SIZE,
  alignment: DEFAULT_CONTENT_ALIGN,
} satisfies BannerState;

const sizeField: EditorFieldSchema = { key: "size", label: "Type", type: "sizeSelect" };

const backgroundField: EditorFieldSchema = {
  key: "backgroundImage",
  label: "Background",
  type: "backgroundPicker",
};

/** See `src/banner/logo.ts`. */
const logoFields: EditorFieldSchema[] = [
  { key: "logoImage", label: "Logo", type: "logoPicker" },
  { key: "logoSize", label: "Logo size", type: "select", options: CONTENT_SIZE_OPTIONS },
];

/** Horizontal placement of the content (its x in `contentPosition`). */
const alignmentField: EditorFieldSchema = {
  key: "alignment",
  label: "Alignment",
  type: "select",
  options: CONTENT_ALIGN_OPTIONS,
};

/** See `src/banner/contentSize.ts`. */
const contentSizeField: EditorFieldSchema = {
  key: "contentSize",
  label: "Content size",
  type: "select",
  options: CONTENT_SIZE_OPTIONS,
};

/** The contribution grid's settings (GitHub and contribution banners). */
type ContributionGridState = {
  year: string;
  themeId: GridColorsId;
  cellShape: ContributionCellShape;
};

const contributionGridInitialState = {
  year: String(currentYear()),
  themeId: DEFAULT_GRID_COLORS_ID,
  cellShape: DEFAULT_CELL_SHAPE,
} satisfies ContributionGridState;

/** The grid colors; the sidebar calls them "Grid colors" (settingGroups.ts). */
const gridColorsField: EditorFieldSchema = { key: "themeId", label: "Theme", type: "select" };

const yearField: EditorFieldSchema = { key: "year", label: "Year", type: "select" };

const cellShapeField: EditorFieldSchema = {
  key: "cellShape",
  label: "Cell shape",
  type: "select",
  options: CONTRIBUTION_CELL_SHAPE_OPTIONS,
};

/** The GitHub profile above the content (GitHub and repos banners). */
type ProfileState = {
  username: string;
  showAvatar: boolean;
  showDisplayName: boolean;
  profilePosition: ProfilePosition;
};

const profileInitialState = {
  username: "",
  showAvatar: true,
  showDisplayName: false,
  profilePosition: "left",
} satisfies ProfileState;

/** Which side of the content the avatar and name sit on. */
const profilePositionField: EditorFieldSchema = {
  key: "profilePosition",
  label: "Profile position",
  type: "select",
  options: PROFILE_POSITION_OPTIONS,
};

const profileFields: EditorFieldSchema[] = [
  { key: "showAvatar", label: "Profile photo", type: "toggle" },
  { key: "showDisplayName", label: "Full name", type: "toggle" },
];

export const githubBannerDefinition: TemplateDefinition<
  BannerState &
    ContributionGridState &
    ProfileState & {
      showMonthLabels: boolean;
      showDayLabels: boolean;
      showTotal: boolean;
      contentSize: ContentSize;
    }
> = {
  meta: {
    id: "github-banner",
    title: "GitHub Banner",
    description: "Username, avatar, and contributions.",
    needsUsername: true,
    githubData: ["user", "contributions"],
  },
  schema: [
    sizeField,
    gridColorsField,
    backgroundField,
    yearField,
    alignmentField,
    profilePositionField,
    contentSizeField,
    cellShapeField,
    ...profileFields,
    { key: "showMonthLabels", label: "Months", type: "toggle" },
    { key: "showDayLabels", label: "Weekdays", type: "toggle" },
    { key: "showTotal", label: "Contributions", type: "toggle" },
    ...logoFields,
  ],
  initialState: {
    ...bannerInitialState,
    ...contributionGridInitialState,
    ...profileInitialState,
    showMonthLabels: true,
    showDayLabels: true,
    showTotal: true,
    contentSize: DEFAULT_CONTENT_SIZE,
  },
};

export const reposBannerDefinition: TemplateDefinition<
  BannerState &
    ProfileState & {
      mode: RepoMode;
      selectedRepos: string;
      maxRepos: number;
      showDescription: boolean;
      showLanguage: boolean;
      showStars: boolean;
      showForks: boolean;
      contentSize: ContentSize;
    }
> = {
  meta: {
    id: "repos-banner",
    title: "Repos Banner",
    description: "Languages, stars, and forks.",
    needsUsername: true,
    githubData: ["user", "repos"],
  },
  schema: [
    sizeField,
    backgroundField,
    alignmentField,
    profilePositionField,
    contentSizeField,
    ...profileFields,
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
    ...bannerInitialState,
    ...profileInitialState,
    mode: "pinned",
    selectedRepos: "",
    maxRepos: MAX_REPOS,
    showDescription: true,
    showLanguage: true,
    showStars: true,
    showForks: true,
    contentSize: DEFAULT_CONTENT_SIZE,
  },
};

export const contributionBannerDefinition: TemplateDefinition<
  BannerState &
    ContributionGridState & {
      username: string;
      contentSize: ContentSizeOrFill;
    }
> = {
  meta: {
    id: "contribution-banner",
    title: "Contribution Banner",
    description: "Contribution heatmap.",
    needsUsername: true,
    githubData: ["contributions"],
  },
  schema: [
    sizeField,
    gridColorsField,
    backgroundField,
    yearField,
    alignmentField,
    { ...contentSizeField, options: [...CONTENT_SIZE_OPTIONS, { label: "Fill", value: "fill" }] },
    cellShapeField,
    ...logoFields,
  ],
  initialState: {
    ...bannerInitialState,
    ...contributionGridInitialState,
    username: "",
    contentSize: DEFAULT_CONTENT_SIZE,
  },
};

export const quoteBannerDefinition: TemplateDefinition<
  BannerState & {
    quote: string;
    author: string;
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
  }
> = {
  meta: {
    id: "quote-banner",
    title: "Quote Banner",
    description: "Typographic quotes.",
    needsUsername: false,
    githubData: [],
  },
  schema: [
    sizeField,
    backgroundField,
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
    ...bannerInitialState,
    ...DEFAULT_QUOTE_STYLE,
    authorSize: "m",
    quote: "Build once, ship everywhere.",
    author: "Omnivix",
    contentSize: "m",
  },
};
