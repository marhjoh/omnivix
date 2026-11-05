import type { Theme } from "@/src/theme/theme";
import type {
  ContributionsNormalized,
  GithubUserNormalized,
  RepoNormalized,
} from "@/src/github/types";

export const TEMPLATE_IDS = [
  "github-banner",
  "repos-banner",
  "contribution-banner",
  "quote-banner",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export type EditorFieldType =
  | "text"
  | "textarea"
  | "toggle"
  | "select"
  | "backgroundPicker"
  | "logoPicker"
  | "colorPicker"
  | "sizeSelect"
  | "range"
  | "repoMultiSelect";

export interface EditorFieldSchema {
  key: string;
  label: string;
  type: EditorFieldType;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  min?: number;
  max?: number;
  step?: number;
  /** Longest allowed text, for text and textarea fields. */
  maxLength?: number;
}

interface TemplateMeta {
  id: TemplateId;
  title: string;
  description: string;
  needsUsername: boolean;
  /** GitHub data the banner itself draws; the export fetches only these. */
  githubData: GithubDataKind[];
}

export type GithubDataKind = "user" | "contributions" | "repos";

export interface TemplateDefinition {
  meta: TemplateMeta;
  schema: EditorFieldSchema[];
  initialState: Record<string, unknown>;
}

export interface RenderData {
  user?: GithubUserNormalized;
  contributions?: ContributionsNormalized;
  repos?: RepoNormalized[];
}

/** What every template's renderer gets. It draws the content; BannerRenderer adds the frame. */
export interface RendererProps {
  state: Record<string, unknown>;
  data: RenderData;
  uiTheme: Theme;
}
