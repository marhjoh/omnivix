import type { BannerSettings, EditorFieldSchema, FieldValue } from "@/src/templates/types";

/**
 * The value a sidebar field edits. EditorFieldSchema only lets a field name a setting of its
 * control's type, but TypeScript can't follow that through a lookup by key.
 */
export function fieldValue<F extends EditorFieldSchema>(state: BannerSettings, field: F) {
  const settings: Readonly<Record<string, unknown>> = state;
  return settings[field.key] as FieldValue<F>;
}
