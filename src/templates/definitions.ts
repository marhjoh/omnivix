import { z } from "zod";
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

const baseState = z.object({
  size: z.enum(BANNER_SIZE_KEYS),
  themeId: z.string(),
  backgroundImage: z.string().optional(),
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
  label: "Profile Position",
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
    tags: ["GitHub", "Profile", "Contributions"],
    needsUsername: true,
  },
  schema: [
    { key: "size", label: "Type", type: "sizeSelect" },
    { key: "themeId", label: "Theme", type: "select" },
    { key: "backgroundImage", label: "Background", type: "backgroundPicker" },
    { key: "year", label: "Year", type: "select" },
    alignmentField,
    profilePositionField,
    contentSizeField,
    {
      key: "cellShape",
      label: "Cell shape",
      type: "select",
      options: [...CONTRIBUTION_CELL_SHAPE_OPTIONS],
    },
    { key: "showMonthLabels", label: "Months", type: "toggle" },
    { key: "showDayLabels", label: "Weekdays", type: "toggle" },
    { key: "showTotal", label: "Contributions", type: "toggle" },
    { key: "showAvatar", label: "Profile photo", type: "toggle" },
    { key: "showDisplayName", label: "Full Name", type: "toggle" },
  ],
  stateSchema: baseState.extend({
    username: z.string().min(1),
    year: z.string().default(String(new Date().getFullYear())),
    showMonthLabels: z.boolean().default(true),
    showDayLabels: z.boolean().default(true),
    showTotal: z.boolean().default(true),
    showAvatar: z.boolean().default(true),
    showDisplayName: z.boolean().default(false),
    profilePosition: profilePositionState,
    alignment: alignmentState,
    contentSize: contentSizeState,
    cellShape: z.enum(CONTRIBUTION_CELL_SHAPES).default("rounded"),
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

export const pinnedReposDefinition: TemplateDefinition<{
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
    tags: ["GitHub", "Repos"],
    needsUsername: true,
  },
  schema: [
    { key: "size", label: "Type", type: "sizeSelect" },
    { key: "backgroundImage", label: "Background", type: "backgroundPicker" },
    alignmentField,
    profilePositionField,
    contentSizeField,
    { key: "showAvatar", label: "Profile photo", type: "toggle" },
    { key: "showDisplayName", label: "Full Name", type: "toggle" },
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
    { key: "maxRepos", label: "Amount", type: "range", min: 1, max: 6, step: 1 },
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
    maxRepos: z.number().min(1).max(6).default(6),
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
    maxRepos: 6,
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
    tags: ["Contributions", "Heatmap"],
    needsUsername: true,
  },
  schema: [
    { key: "size", label: "Type", type: "sizeSelect" },
    { key: "themeId", label: "Theme", type: "select" },
    { key: "backgroundImage", label: "Background", type: "backgroundPicker" },
    { key: "year", label: "Year", type: "select" },
    alignmentField,
    { ...contentSizeField, options: [...CONTENT_SIZE_OPTIONS, { label: "Fill", value: "fill" }] },
    {
      key: "cellShape",
      label: "Cell shape",
      type: "select",
      options: [...CONTRIBUTION_CELL_SHAPE_OPTIONS],
    },
  ],
  stateSchema: baseState.extend({
    username: z.string().min(1),
    alignment: alignmentState,
    contentSize: z.enum(CONTENT_SIZES_OR_FILL),
    year: z.string().default(String(new Date().getFullYear())),
    cellShape: z.enum(CONTRIBUTION_CELL_SHAPES).default("rounded"),
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
    tags: ["Quote", "Typography"],
    needsUsername: false,
  },
  schema: [
    { key: "size", label: "Type", type: "sizeSelect" },
    { key: "backgroundImage", label: "Background", type: "backgroundPicker" },
    alignmentField,
    contentSizeField,
    { key: "quote", label: "Quote Text", type: "textarea", required: true },
    { key: "author", label: "Author", type: "text" },
  ],
  stateSchema: baseState.extend({
    quote: z.string().min(1),
    author: z.string().default(""),
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
