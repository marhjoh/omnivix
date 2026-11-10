import { CONTENT_ALIGN_OPTIONS, DEFAULT_CONTENT_ALIGN } from "@/src/banner/contentPosition";
import { PROFILE_POSITION_OPTIONS } from "@/src/banner/profilePosition";
import { CONTENT_SIZE_OPTIONS, DEFAULT_CONTENT_SIZE } from "@/src/banner/contentSize";
import { CONTRIBUTION_CELL_SHAPE_OPTIONS, DEFAULT_CELL_SHAPE } from "@/src/banner/cellShape";
import { DEFAULT_GRID_COLORS_ID } from "@/src/banner/gridColors";
import { DEFAULT_BANNER_SIZE } from "@/src/lib/sizes";
import type { EditorFieldSchema, TemplateDefinition } from "@/src/templates/types";
import type {
  BaseSettings,
  ContributionGridSettings,
  GridStyleSettings,
  ProfileSettings,
  TemplateSettings,
} from "@/src/templates/stateSchemas";
import { MAX_REPOS, REPO_MODES } from "@/src/lib/repoSelection";
import { currentYear } from "@/src/lib/contributionYear";
import { DEFAULT_LOGO_SIZE } from "@/src/banner/logo";
import {
  CREDIT_CONTENT_OPTIONS,
  CREDIT_STYLE_OPTIONS,
  DEFAULT_CREDIT_CONTENT,
  DEFAULT_CREDIT_SIZE,
  DEFAULT_CREDIT_STYLE,
} from "@/src/banner/credit";
import {
  DEFAULT_ICONS,
  DEFAULT_ICONS_PER_ROW,
  MAX_ICONS_PER_ROW,
  MIN_ICONS_PER_ROW,
} from "@/src/banner/techStack";
import { GRID_TEXT_MAX_LENGTH, toGridText } from "@/src/banner/gridText";
import {
  DEFAULT_INTRO_ICONS,
  HEADLINE_MAX_LENGTH,
  INTRO_LINKS,
  LINK_MAX_LENGTH,
  NAME_MAX_LENGTH,
  TAGLINE_MAX_LENGTH,
} from "@/src/banner/intro";
import { TERMINAL_TEXT_MAX_LENGTH, TERMINAL_TEXT_ROWS } from "@/src/banner/terminal";
import {
  DEFAULT_BADGES_PER_ROW,
  DEFAULT_CERTIFICATIONS,
  MAX_BADGES_PER_ROW,
  MIN_BADGES_PER_ROW,
} from "@/src/banner/certifications";
import { DEFAULT_POSTS, MAX_POSTS, MIN_POSTS } from "@/src/banner/feed";
import {
  AUTHOR_MAX_LENGTH,
  DEFAULT_QUOTE_STYLE,
  QUOTE_COLOR_OPTIONS,
  QUOTE_MAX_LENGTH,
  AUTHOR_PREFIX_OPTIONS,
  QUOTE_FONT_OPTIONS,
  QUOTE_FONT_STYLE_OPTIONS,
  QUOTE_MARKS_OPTIONS,
} from "@/src/banner/quoteStyle";

// The sidebar shows fields in `schema` order. Validation is in stateSchemas.ts.

/** Defaults every banner shares. The background has none. */
const bannerInitialState: Pick<
  BaseSettings,
  "size" | "logoSize" | "alignment" | "credit" | "creditContent" | "creditSize"
> = {
  size: DEFAULT_BANNER_SIZE,
  logoSize: DEFAULT_LOGO_SIZE,
  alignment: DEFAULT_CONTENT_ALIGN,
  credit: DEFAULT_CREDIT_STYLE,
  creditContent: DEFAULT_CREDIT_CONTENT,
  creditSize: DEFAULT_CREDIT_SIZE,
};

const sizeField: EditorFieldSchema<BaseSettings> = {
  key: "size",
  label: "Type",
  type: "sizeSelect",
};

const backgroundField: EditorFieldSchema<BaseSettings> = {
  key: "backgroundImage",
  label: "Background",
  type: "backgroundPicker",
};

/** The logo and the credit, which sit on top of every banner. */
const overlayFields: EditorFieldSchema<BaseSettings>[] = [
  { key: "logoImage", label: "Logo", type: "logoPicker" },
  { key: "logoSize", label: "Logo size", type: "select", options: CONTENT_SIZE_OPTIONS },
  { key: "credit", label: "Credit", type: "select", options: CREDIT_STYLE_OPTIONS },
  {
    key: "creditContent",
    label: "Credit content",
    type: "select",
    options: CREDIT_CONTENT_OPTIONS,
  },
  { key: "creditSize", label: "Credit size", type: "select", options: CONTENT_SIZE_OPTIONS },
];

const alignmentField: EditorFieldSchema<BaseSettings> = {
  key: "alignment",
  label: "Alignment",
  type: "select",
  options: CONTENT_ALIGN_OPTIONS,
};

const contentSizeField: EditorFieldSchema<{ contentSize: string }> = {
  key: "contentSize",
  label: "Content size",
  type: "select",
  options: CONTENT_SIZE_OPTIONS,
};

/** Shared by the GitHub and contribution banners. */
const contributionGridInitialState: ContributionGridSettings = {
  year: String(currentYear()),
  themeId: DEFAULT_GRID_COLORS_ID,
  cellShape: DEFAULT_CELL_SHAPE,
};

/** The sidebar labels this "Grid colors" (settingGroups.ts). */
const gridColorsField: EditorFieldSchema<GridStyleSettings> = {
  key: "themeId",
  label: "Theme",
  type: "select",
};

const yearField: EditorFieldSchema<ContributionGridSettings> = {
  key: "year",
  label: "Year",
  type: "select",
};

const cellShapeField: EditorFieldSchema<GridStyleSettings> = {
  key: "cellShape",
  label: "Cell shape",
  type: "select",
  options: CONTRIBUTION_CELL_SHAPE_OPTIONS,
};

/** Shared by the GitHub, repos and stats banners. */
const profileInitialState: ProfileSettings = {
  username: "",
  showAvatar: true,
  showDisplayName: false,
  profilePosition: "left",
};

const profilePositionField: EditorFieldSchema<ProfileSettings> = {
  key: "profilePosition",
  label: "Profile position",
  type: "select",
  options: PROFILE_POSITION_OPTIONS,
};

const profileFields: EditorFieldSchema<ProfileSettings>[] = [
  { key: "showAvatar", label: "Profile photo", type: "toggle" },
  { key: "showDisplayName", label: "Full name", type: "toggle" },
];

export const githubBannerDefinition: TemplateDefinition<TemplateSettings["github-banner"]> = {
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
    ...overlayFields,
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

export const reposBannerDefinition: TemplateDefinition<TemplateSettings["repos-banner"]> = {
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
    ...overlayFields,
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

export const statsBannerDefinition: TemplateDefinition<TemplateSettings["stats-banner"]> = {
  meta: {
    id: "stats-banner",
    title: "Stats Banner",
    description: "Stars, followers, and streaks.",
    needsUsername: true,
    githubData: ["user", "contributions", "repos", "organizations"],
  },
  schema: [
    sizeField,
    backgroundField,
    alignmentField,
    profilePositionField,
    contentSizeField,
    ...profileFields,
    { key: "showRepoCount", label: "Repos", type: "toggle" },
    { key: "showStarCount", label: "Stars", type: "toggle" },
    { key: "showFollowerCount", label: "Followers", type: "toggle" },
    { key: "showFollowingCount", label: "Following", type: "toggle" },
    { key: "showPullRequestCount", label: "Pull requests", type: "toggle" },
    { key: "showContributionCount", label: "Contributions", type: "toggle" },
    { key: "showCurrentStreak", label: "Current streak", type: "toggle" },
    { key: "showLongestStreak", label: "Longest streak", type: "toggle" },
    { key: "showLanguages", label: "Languages", type: "toggle" },
    { key: "showOrganizations", label: "Organizations", type: "toggle" },
    { key: "showIconColors", label: "Icon colors", type: "toggle" },
    ...overlayFields,
  ],
  initialState: {
    ...bannerInitialState,
    ...profileInitialState,
    contentSize: DEFAULT_CONTENT_SIZE,
    showRepoCount: true,
    showStarCount: true,
    showFollowerCount: true,
    showFollowingCount: false,
    showPullRequestCount: false,
    showContributionCount: true,
    showCurrentStreak: true,
    showLongestStreak: true,
    showLanguages: true,
    showOrganizations: false,
    showIconColors: true,
  },
};

export const techStackBannerDefinition: TemplateDefinition<TemplateSettings["tech-stack-banner"]> =
  {
    meta: {
      id: "tech-stack-banner",
      title: "Tech Stack Banner",
      description: "The tools you use, as brand icons.",
      needsUsername: false,
      githubData: [],
    },
    schema: [
      sizeField,
      backgroundField,
      alignmentField,
      contentSizeField,
      { key: "icons", label: "Icons", type: "iconPicker", required: true },
      {
        key: "iconsPerRow",
        label: "Icons per row",
        type: "range",
        min: MIN_ICONS_PER_ROW,
        max: MAX_ICONS_PER_ROW,
        step: 1,
      },
      { key: "showLabels", label: "Names", type: "toggle" },
      { key: "showIconColors", label: "Icon colors", type: "toggle" },
      ...overlayFields,
    ],
    initialState: {
      ...bannerInitialState,
      contentSize: DEFAULT_CONTENT_SIZE,
      icons: DEFAULT_ICONS,
      iconsPerRow: DEFAULT_ICONS_PER_ROW,
      showLabels: true,
      showIconColors: true,
    },
  };

export const introBannerDefinition: TemplateDefinition<TemplateSettings["intro-banner"]> = {
  meta: {
    id: "intro-banner",
    title: "Intro Banner",
    description: "Your name, headline, and links.",
    needsUsername: false,
    githubData: [],
  },
  schema: [
    sizeField,
    backgroundField,
    alignmentField,
    contentSizeField,
    { key: "name", label: "Name", type: "text", required: true, maxLength: NAME_MAX_LENGTH },
    { key: "headline", label: "Headline", type: "text", maxLength: HEADLINE_MAX_LENGTH },
    { key: "tagline", label: "Tagline", type: "textarea", maxLength: TAGLINE_MAX_LENGTH },
    { key: "photoImage", label: "Photo", type: "photoPicker" },
    ...INTRO_LINKS.map(({ key, label }): EditorFieldSchema<TemplateSettings["intro-banner"]> => ({
      key,
      label,
      type: "text",
      maxLength: LINK_MAX_LENGTH,
    })),
    { key: "icons", label: "Icons", type: "iconPicker" },
    { key: "showHeadline", label: "Headline", type: "toggle" },
    { key: "showLinks", label: "Links", type: "toggle" },
    { key: "showIcons", label: "Icons", type: "toggle" },
    { key: "showIconColors", label: "Icon colors", type: "toggle" },
    ...overlayFields,
  ],
  initialState: {
    ...bannerInitialState,
    contentSize: DEFAULT_CONTENT_SIZE,
    name: "Martin Johannessen",
    headline: "Developer",
    tagline: "Turning messy real-world problems into products.",
    github: "marhjoh",
    linkedin: "martinhejo",
    x: "",
    website: "",
    email: "",
    icons: DEFAULT_INTRO_ICONS,
    showHeadline: true,
    showLinks: true,
    showIcons: true,
    showIconColors: true,
  },
};

export const terminalBannerDefinition: TemplateDefinition<TemplateSettings["terminal-banner"]> = {
  meta: {
    id: "terminal-banner",
    title: "Terminal Banner",
    description: "Your setup and stats, terminal style.",
    needsUsername: true,
    githubData: ["user", "contributions", "repos"],
  },
  schema: [
    sizeField,
    backgroundField,
    alignmentField,
    contentSizeField,
    { key: "keyColor", label: "Key color", type: "colorPicker", options: QUOTE_COLOR_OPTIONS },
    ...TERMINAL_TEXT_ROWS.map(
      ({ key, label }): EditorFieldSchema<TemplateSettings["terminal-banner"]> => ({
        key,
        label,
        type: "text",
        maxLength: TERMINAL_TEXT_MAX_LENGTH,
      }),
    ),
    { key: "showAvatar", label: "Profile photo", type: "toggle" },
    { key: "showRepoCount", label: "Repos", type: "toggle" },
    { key: "showStarCount", label: "Stars", type: "toggle" },
    { key: "showFollowerCount", label: "Followers", type: "toggle" },
    { key: "showContributionCount", label: "Contributions", type: "toggle" },
    { key: "showStreak", label: "Streak", type: "toggle" },
    { key: "showLanguages", label: "Languages", type: "toggle" },
    { key: "showColorBlocks", label: "Color blocks", type: "toggle" },
    { key: "showWindow", label: "Window", type: "toggle" },
    ...overlayFields,
  ],
  initialState: {
    ...bannerInitialState,
    contentSize: DEFAULT_CONTENT_SIZE,
    username: "",
    showAvatar: true,
    role: "Developer",
    location: "",
    editor: "VS Code",
    shell: "zsh",
    os: "macOS",
    keyColor: "blue",
    showRepoCount: true,
    showStarCount: true,
    showFollowerCount: true,
    showContributionCount: true,
    showStreak: true,
    showLanguages: true,
    showColorBlocks: true,
    showWindow: true,
  },
};

export const aiUsageBannerDefinition: TemplateDefinition<TemplateSettings["ai-usage-banner"]> = {
  meta: {
    id: "ai-usage-banner",
    title: "AI Usage Banner",
    description: "Your coding agent usage, from ccusage.",
    needsUsername: false,
    githubData: [],
  },
  schema: [
    sizeField,
    gridColorsField,
    backgroundField,
    alignmentField,
    contentSizeField,
    cellShapeField,
    { key: "usage", label: "AI usage", type: "usagePaste", required: true },
    { key: "showTokenCount", label: "Tokens", type: "toggle" },
    // Hidden when the paste has no cost (ControlSidebar).
    { key: "showCost", label: "Cost", type: "toggle" },
    { key: "showActiveDays", label: "Active days", type: "toggle" },
    { key: "showCurrentStreak", label: "Current streak", type: "toggle" },
    { key: "showLongestStreak", label: "Longest streak", type: "toggle" },
    { key: "showHeatmap", label: "Heatmap", type: "toggle" },
    { key: "showModels", label: "Models", type: "toggle" },
    { key: "showAgents", label: "Agents", type: "toggle" },
    { key: "showIconColors", label: "Icon colors", type: "toggle" },
    ...overlayFields,
  ],
  initialState: {
    ...bannerInitialState,
    contentSize: DEFAULT_CONTENT_SIZE,
    themeId: "claude",
    cellShape: DEFAULT_CELL_SHAPE,
    usage: "",
    showTokenCount: true,
    showCost: true,
    showActiveDays: true,
    showCurrentStreak: false,
    showLongestStreak: true,
    showHeatmap: true,
    showModels: true,
    showAgents: true,
    showIconColors: true,
  },
};

export const certificationsBannerDefinition: TemplateDefinition<
  TemplateSettings["certifications-banner"]
> = {
  meta: {
    id: "certifications-banner",
    title: "Certifications Banner",
    description: "Your certifications, as badges.",
    needsUsername: false,
    githubData: [],
  },
  schema: [
    sizeField,
    backgroundField,
    alignmentField,
    contentSizeField,
    {
      key: "certifications",
      label: "Certifications",
      type: "certificationList",
      required: true,
    },
    {
      key: "badgesPerRow",
      label: "Badges per row",
      type: "range",
      min: MIN_BADGES_PER_ROW,
      max: MAX_BADGES_PER_ROW,
      step: 1,
    },
    { key: "showIssuer", label: "Issuer", type: "toggle" },
    { key: "showYear", label: "Year", type: "toggle" },
    { key: "showIconColors", label: "Icon colors", type: "toggle" },
    ...overlayFields,
  ],
  initialState: {
    ...bannerInitialState,
    contentSize: DEFAULT_CONTENT_SIZE,
    certifications: DEFAULT_CERTIFICATIONS,
    badgesPerRow: DEFAULT_BADGES_PER_ROW,
    showIssuer: true,
    showYear: true,
    showIconColors: true,
  },
};

export const latestPostsBannerDefinition: TemplateDefinition<
  TemplateSettings["latest-posts-banner"]
> = {
  meta: {
    id: "latest-posts-banner",
    title: "Latest Posts Banner",
    description: "Your newest blog posts, from an RSS or Atom feed.",
    needsUsername: false,
    githubData: [],
  },
  schema: [
    sizeField,
    backgroundField,
    alignmentField,
    contentSizeField,
    { key: "feed", label: "Feed", type: "feedLink", required: true },
    {
      key: "postCount",
      label: "Number of posts",
      type: "range",
      min: MIN_POSTS,
      max: MAX_POSTS,
      step: 1,
    },
    { key: "showDates", label: "Dates", type: "toggle" },
    ...overlayFields,
  ],
  initialState: {
    ...bannerInitialState,
    contentSize: DEFAULT_CONTENT_SIZE,
    feed: "",
    postCount: DEFAULT_POSTS,
    showDates: true,
  },
};

export const contributionBannerDefinition: TemplateDefinition<
  TemplateSettings["contribution-banner"]
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
    ...overlayFields,
    {
      key: "gridText",
      label: "Text",
      type: "text",
      maxLength: GRID_TEXT_MAX_LENGTH,
      format: toGridText,
    },
    // Shown once there's text: off leaves the grid empty behind it.
    { key: "showContributions", label: "Contributions", type: "toggle" },
  ],
  initialState: {
    ...bannerInitialState,
    ...contributionGridInitialState,
    username: "",
    contentSize: DEFAULT_CONTENT_SIZE,
    gridText: "",
    showContributions: false,
  },
};

export const quoteBannerDefinition: TemplateDefinition<TemplateSettings["quote-banner"]> = {
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
    ...overlayFields,
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
