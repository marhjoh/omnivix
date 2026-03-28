import { z } from "zod";
import { TemplateDefinition } from "@/src/types/template";

/** GitHub + contribution banner: schema, sidebar options, Zod, and ContributionGrid. */
export const CONTRIBUTION_CELL_SHAPES = ["rounded", "square", "circle"] as const;

export type ContributionCellShape = (typeof CONTRIBUTION_CELL_SHAPES)[number];

const CONTRIBUTION_CELL_SHAPE_LABELS: Record<ContributionCellShape, string> = {
  rounded: "Rounded",
  square: "Square",
  circle: "Circle",
};

export const CONTRIBUTION_CELL_SHAPE_OPTIONS: Array<{ label: string; value: ContributionCellShape }> =
  CONTRIBUTION_CELL_SHAPES.map((value) => ({ label: CONTRIBUTION_CELL_SHAPE_LABELS[value], value }));

export function contributionCellShapeFromState(raw: unknown): ContributionCellShape {
  if (typeof raw === "string" && (CONTRIBUTION_CELL_SHAPES as readonly string[]).includes(raw)) {
    return raw as ContributionCellShape;
  }
  return "rounded";
}

const baseState = z.object({
  size: z.enum(["xHeader", "linkedinCover"]),
  themeId: z.string(),
  backgroundImage: z.string().optional(),
});

export const githubBannerDefinition: TemplateDefinition<{
  username: string;
  year: string;
  showMonthLabels: boolean;
  showDayLabels: boolean;
  showTotal: boolean;
  showDisplayName: boolean;
  profilePosition: "left" | "right";
  gridPosition: "left" | "center" | "right";
  gridSize: string;
  cellShape: ContributionCellShape;
  size: "xHeader" | "linkedinCover";
  themeId: string;
  backgroundImage?: string;
}> = {
  meta: {
    id: "github-banner",
    title: "GitHub Banner",
    description: "Username, avatar, and contributions.",
    defaultSize: "linkedinCover",
    tags: ["GitHub", "Profile", "Contributions"],
    needsUsername: true,
  },
  schema: [
    { key: "size", label: "Type", type: "sizeSelect" },
    { key: "themeId", label: "Theme", type: "select" },
    { key: "backgroundImage", label: "Background", type: "backgroundPicker" },
    { key: "year", label: "Year", type: "select" },
    {
      key: "gridPosition",
      label: "Grid Position",
      type: "select",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    {
      key: "profilePosition",
      label: "Profile Position",
      type: "select",
      options: [
        { label: "Left", value: "left" },
        { label: "Right", value: "right" },
      ],
    },
    {
      key: "gridSize",
      label: "Size",
      type: "select",
      options: [
        { label: "XS", value: "xs" },
        { label: "S", value: "s" },
        { label: "M", value: "m" },
        { label: "L", value: "l" },
        { label: "XL", value: "xl" },
      ],
    },
    {
      key: "cellShape",
      label: "Cell shape",
      type: "select",
      options: [...CONTRIBUTION_CELL_SHAPE_OPTIONS],
    },
    { key: "showMonthLabels", label: "Month Labels", type: "toggle" },
    { key: "showDayLabels", label: "Day Labels", type: "toggle" },
    { key: "showTotal", label: "Contribution Count", type: "toggle" },
    { key: "showDisplayName", label: "Show Full Name", type: "toggle" },
  ],
  stateSchema: baseState.extend({
    username: z.string().min(1),
    year: z.string().default(String(new Date().getFullYear())),
    showMonthLabels: z.boolean().default(true),
    showDayLabels: z.boolean().default(true),
    showTotal: z.boolean().default(true),
    showDisplayName: z.boolean().default(false),
    profilePosition: z.enum(["left", "right"]).default("left"),
    gridPosition: z.enum(["left", "center", "right"]).default("left"),
    gridSize: z.string().default("m"),
    cellShape: z.enum(CONTRIBUTION_CELL_SHAPES).default("rounded"),
  }),
  initialState: {
    username: "",
    themeId: "midnight",
    size: "linkedinCover",
    year: String(new Date().getFullYear()),
    showMonthLabels: true,
    showDayLabels: true,
    showTotal: true,
    showDisplayName: false,
    profilePosition: "left",
    gridPosition: "left",
    gridSize: "m",
    cellShape: "rounded",
  },
};

export const pinnedReposDefinition: TemplateDefinition<{
  username: string;
  mode: "pinned" | "selected";
  selectedRepos: string;
  maxRepos: number;
  showDescription: boolean;
  showLanguage: boolean;
  showStars: boolean;
  showForks: boolean;
  size: "xHeader" | "linkedinCover";
  themeId: string;
  backgroundImage?: string;
}> = {
  meta: {
    id: "repos-banner",
    title: "Repos Banner",
    description: "Languages, stars, and forks.",
    defaultSize: "linkedinCover",
    tags: ["GitHub", "Repos"],
    needsUsername: true,
  },
  schema: [
    { key: "size", label: "Type", type: "sizeSelect" },
    { key: "themeId", label: "Theme", type: "select" },
    { key: "backgroundImage", label: "Background", type: "backgroundPicker" },
    {
      key: "mode",
      label: "Mode",
      type: "select",
      options: [
        { label: "Pinned (auto)", value: "pinned" },
        { label: "Selected", value: "selected" },
      ],
    },
    {
      key: "selectedRepos",
      label: "Repos (comma separated)",
      type: "text",
      placeholder: "repo-a, repo-b",
    },
    { key: "maxRepos", label: "Max Repos", type: "range", min: 1, max: 6, step: 1 },
    { key: "showDescription", label: "Description", type: "toggle" },
    { key: "showLanguage", label: "Language", type: "toggle" },
    { key: "showStars", label: "Stars", type: "toggle" },
    { key: "showForks", label: "Forks", type: "toggle" },
  ],
  stateSchema: baseState.extend({
    username: z.string().min(1),
    mode: z.enum(["pinned", "selected"]),
    selectedRepos: z.string().default(""),
    maxRepos: z.number().min(1).max(6).default(6),
    showDescription: z.boolean().default(true),
    showLanguage: z.boolean().default(true),
    showStars: z.boolean().default(true),
    showForks: z.boolean().default(true),
  }),
  initialState: {
    username: "",
    mode: "pinned",
    selectedRepos: "",
    maxRepos: 6,
    showDescription: true,
    showLanguage: true,
    showStars: true,
    showForks: true,
    themeId: "midnight",
    size: "linkedinCover",
  },
};

export const contributionBannerDefinition: TemplateDefinition<{
  username: string;
  year: string;
  gridSize: string;
  cellShape: ContributionCellShape;
  size: "xHeader" | "linkedinCover";
  themeId: string;
  backgroundImage?: string;
}> = {
  meta: {
    id: "contribution-banner",
    title: "Contribution Banner",
    description: "Contribution heatmap.",
    defaultSize: "linkedinCover",
    tags: ["Contributions", "Heatmap"],
    needsUsername: true,
  },
  schema: [
    { key: "size", label: "Type", type: "sizeSelect" },
    { key: "themeId", label: "Theme", type: "select" },
    { key: "backgroundImage", label: "Background", type: "backgroundPicker" },
    { key: "year", label: "Year", type: "select" },
    {
      key: "gridSize",
      label: "Size",
      type: "select",
      options: [
        { label: "XS", value: "xs" },
        { label: "S", value: "s" },
        { label: "M", value: "m" },
        { label: "L", value: "l" },
        { label: "XL", value: "xl" },
        { label: "Fill", value: "fill" },
      ],
    },
    {
      key: "cellShape",
      label: "Cell shape",
      type: "select",
      options: [...CONTRIBUTION_CELL_SHAPE_OPTIONS],
    },
  ],
  stateSchema: baseState.extend({
    username: z.string().min(1),
    gridSize: z.string().default("l"),
    year: z.string().default(String(new Date().getFullYear())),
    cellShape: z.enum(CONTRIBUTION_CELL_SHAPES).default("rounded"),
  }),
  initialState: {
    username: "",
    gridSize: "l",
    cellShape: "rounded",
    themeId: "midnight",
    size: "linkedinCover",
    year: String(new Date().getFullYear()),
  },
};

export const quoteBannerDefinition: TemplateDefinition<{
  quote: string;
  author: string;
  alignment: "left" | "center" | "right";
  size: "xHeader" | "linkedinCover";
  themeId: string;
  backgroundImage?: string;
}> = {
  meta: {
    id: "quote-banner",
    title: "Quote Banner",
    description: "Typographic quotes.",
    defaultSize: "linkedinCover",
    tags: ["Quote", "Typography"],
    needsUsername: false,
  },
  schema: [
    { key: "quote", label: "Quote Text", type: "textarea", required: true },
    { key: "author", label: "Author", type: "text", required: true },
    {
      key: "alignment",
      label: "Alignment",
      type: "select",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    { key: "size", label: "Type", type: "sizeSelect" },
    { key: "themeId", label: "Theme", type: "select" },
    { key: "backgroundImage", label: "Background", type: "backgroundPicker" },
  ],
  stateSchema: baseState.extend({
    quote: z.string().min(1),
    author: z.string().min(1),
    alignment: z.enum(["left", "center", "right"]),
  }),
  initialState: {
    quote: "Build once, ship everywhere.",
    author: "Omnivix",
    alignment: "left",
    themeId: "midnight",
    size: "linkedinCover",
  },
};
