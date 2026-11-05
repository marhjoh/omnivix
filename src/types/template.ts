import type { BannerSize } from "@/src/lib/sizes";
import type { Theme } from "@/src/theme/theme";
import type { ExportPixelRatio, ExportFormat } from "@/src/export/format";

export const TEMPLATE_IDS = [
  "github-banner",
  "repos-banner",
  "contribution-banner",
  "quote-banner",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export type { BannerSize };

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
  defaultSize: BannerSize;
  needsUsername: boolean;
  /** GitHub data the banner itself draws; the export fetches only these. */
  githubData: GithubDataKind[];
}

export type GithubDataKind = "user" | "contributions" | "repos";

export interface TemplateDefinition<TState extends Record<string, unknown>> {
  meta: TemplateMeta;
  schema: EditorFieldSchema[];
  initialState: TState;
}

export interface ExportRequest {
  templateId: TemplateId;
  size: BannerSize;
  state: Record<string, unknown>;
  pixelRatio?: ExportPixelRatio;
  /** PNG when left out, or the size's first format if it doesn't take PNG. */
  format?: ExportFormat;
  /** Matches the studio's theme, so the export looks like the preview. */
  uiTheme?: Theme;
}
