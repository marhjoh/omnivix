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

/** GitHub + contribution banner: schema, sidebar options, Zod, and ContributionGrid. */
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
  return isOneOf(CONTRIBUTION_CELL_SHAPES, raw) ? raw : "rounded";
}

const percent = z.number().min(0).max(100);

/** A post's length: still readable on the 4:1 banner at the smallest text size. */
const QUOTE_MAX_LENGTH = 280;
const AUTHOR_MAX_LENGTH = 60;

const baseState = z.object({
  size: z.enum(BANNER_SIZE_KEYS),
  themeId: z.string(),
  backgroundImage: z.string().optional(),
  backgroundPosition: z.object({ x: percent, y: percent }).optional(),
  backgroundZoom: z.number().min(MIN_BACKGROUND_ZOOM).max(MAX_BACKGROUND_ZOOM).optional(),
});

/** Horizontal placement of the content; in the quote banner also the text alignment. */
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
  label: "Size",
  type: "select",
  options: CONTENT_SIZE_OPTIONS,
};

const contentSizeState = z.enum(CONTENT_SIZES);

/** GitHub and contribution banners: the contribution grid's cells. */
const cellShapeField: EditorFieldSchema = {
  key: "cellShape",
  label: "Cell shape",
  type: "select",
  options: CONTRIBUTION_CELL_SHAPE_OPTIONS,
};
const cellShapeState = z.enum(CONTRIBUTION_CELL_SHAPES).default("rounded");

const yearState = z.string().default(String(new Date().getFullYear()));

export const githubBannerDefinition: TemplateDefinition<{
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
}> = {
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
    { key: "showMonthLabels", label: "Months", type: "toggle" },
    { key: "showDayLabels", label: "Weekdays", type: "toggle" },
    { key: "showTotal", label: "Contributions", type: "toggle" },
    { key: "showAvatar", label: "Profile photo", type: "toggle" },
    { key: "showDisplayName", label: "Full name", type: "toggle" },
  ],
  stateSchema: baseState.extend({
    username: z.string().min(1),
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

export const reposBannerDefinition: TemplateDefinition<{
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
}> = {
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
  ],
  stateSchema: baseState.extend({
    username: z.string().min(1),
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

export const contributionBannerDefinition: TemplateDefinition<{
  username: string;
  year: string;
  alignment: ContentAlign;
  contentSize: ContentSizeOrFill;
  cellShape: ContributionCellShape;
  size: BannerSize;
  themeId: string;
  backgroundImage?: string;
}> = {
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
  ],
  stateSchema: baseState.extend({
    username: z.string().min(1),
    alignment: alignmentState,
    contentSize: z.enum(CONTENT_SIZES_OR_FILL),
    year: yearState,
    cellShape: cellShapeState,
  }),
  initialState: {
    username: "",
    alignment: "center",
    contentSize: DEFAULT_CONTENT_SIZE,
    cellShape: "rounded",
    themeId: "default",
    size: "wide",
    year: String(new Date().getFullYear()),
  },
};

export const quoteBannerDefinition: TemplateDefinition<{
  quote: string;
  author: string;
  alignment: ContentAlign;
  contentSize: ContentSize;
  size: BannerSize;
  themeId: string;
  backgroundImage?: string;
}> = {
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
    contentSizeField,
    {
      key: "quote",
      label: "Quote text",
      type: "textarea",
      required: true,
      maxLength: QUOTE_MAX_LENGTH,
    },
    { key: "author", label: "Author", type: "text", maxLength: AUTHOR_MAX_LENGTH },
  ],
  stateSchema: baseState.extend({
    quote: z.string().min(1).max(QUOTE_MAX_LENGTH),
    author: z.string().max(AUTHOR_MAX_LENGTH).default(""),
    alignment: alignmentState,
    contentSize: contentSizeState,
  }),
  initialState: {
    quote: "Build once, ship everywhere.",
    author: "Omnivix",
    alignment: "center",
    contentSize: "m",
    themeId: "default",
    size: "wide",
  },
};
