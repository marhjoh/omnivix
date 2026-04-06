import { z } from "zod";
import type { Theme } from "@/src/theme/theme";

export type TemplateId =
  | "github-banner"
  | "repos-banner"
  | "contribution-banner"
  | "quote-banner";

export type BannerSize = "xHeader" | "linkedinCover";

export type EditorFieldType =
  | "text"
  | "textarea"
  | "toggle"
  | "select"
  | "backgroundPicker"
  | "sizeSelect"
  | "range"
  | "repoMultiSelect";

export interface EditorFieldSchema {
  key: string;
  label: string;
  type: EditorFieldType;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  min?: number;
  max?: number;
  step?: number;
}

export interface TemplateMeta {
  id: TemplateId;
  title: string;
  description: string;
  defaultSize: BannerSize;
  tags: string[];
  needsUsername?: boolean;
}

export interface TemplateDefinition<TState extends Record<string, unknown>> {
  meta: TemplateMeta;
  schema: EditorFieldSchema[];
  stateSchema: z.ZodType<TState>;
  initialState: TState;
}

export interface ExportRequest {
  templateId: TemplateId;
  size: BannerSize;
  state: Record<string, unknown>;
  format: "png";
  scale: 1 | 2;
  pixelRatio?: 1 | 2 | 3;
  /** Matches editor app theme so PNG matches on-screen preview. */
  uiTheme?: Theme;
}
