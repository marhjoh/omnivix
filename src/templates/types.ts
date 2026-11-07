import type { Theme } from "@/src/theme/theme";
import type { TemplateSettings } from "@/src/templates/stateSchemas";
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

/** Any template's settings. Check a key with `in` to read a setting only some templates have. */
export type BannerSettings = TemplateSettings[TemplateId];

/** The value each kind of control edits. */
interface FieldValues {
  text: string;
  textarea: string;
  toggle: boolean;
  select: string;
  backgroundPicker: string | undefined;
  logoPicker: string | undefined;
  colorPicker: string;
  sizeSelect: string;
  range: number;
  repoMultiSelect: string;
}

export type EditorFieldType = keyof FieldValues;

/** The keys of `S` that hold a `V`. For a union of settings, the keys of each of them. */
type KeysWith<S, V> = S extends unknown
  ? { [K in keyof S]-?: S[K] extends V ? K : never }[keyof S] & string
  : never;

/** A control in the sidebar. Its key must name a setting of the type the control edits. */
export type EditorFieldSchema<S = BannerSettings> = {
  [T in EditorFieldType]: {
    key: KeysWith<S, FieldValues[T]>;
    label: string;
    type: T;
    required?: boolean;
    options?: Array<{ label: string; value: string }>;
    min?: number;
    max?: number;
    step?: number;
    /** Longest allowed text, for text and textarea fields. */
    maxLength?: number;
  };
}[EditorFieldType];

/** The value a field's control edits. */
export type FieldValue<F extends EditorFieldSchema> = FieldValues[F["type"]];

interface TemplateMeta {
  id: TemplateId;
  title: string;
  description: string;
  needsUsername: boolean;
  /** GitHub data the banner draws. The export fetches only these. */
  githubData: GithubDataKind[];
}

export type GithubDataKind = "user" | "contributions" | "repos";

export interface TemplateDefinition<S extends BannerSettings = BannerSettings> {
  meta: TemplateMeta;
  schema: EditorFieldSchema<S>[];
  initialState: S;
}

export interface RenderData {
  user?: GithubUserNormalized;
  contributions?: ContributionsNormalized;
  repos?: RepoNormalized[];
}

/** What every template's renderer gets. It draws the content; BannerRenderer adds the frame. */
export interface RendererProps<K extends TemplateId> {
  state: TemplateSettings[K];
  data: RenderData;
  uiTheme: Theme;
}
