import { BACKGROUND_PRESETS } from "@/src/backgrounds/presets";
import {
  isDefaultBackgroundPosition,
  MAX_BACKGROUND_ZOOM,
  MIN_BACKGROUND_ZOOM,
  type BannerBackground,
} from "@/src/banner/background";
import { isDefaultLogoPosition } from "@/src/banner/logo";
import { BACKGROUND_UPLOAD, LOGO_UPLOAD, PHOTO_UPLOAD } from "@/src/lib/imageUpload";
import { ImagePicker } from "@/src/studio/ImagePicker";
import { ResetButton } from "@/src/studio/ResetButton";
import { fieldLabel } from "@/src/studio/settingGroups";
import { fieldValue } from "@/src/studio/fieldValue";
import type { BannerSettings, EditorFieldSchema } from "@/src/templates/types";
import { Select } from "@/src/ui/Dropdown";
import { RangeField } from "@/src/ui/RangeField";

/** Zoom slider step: 5 percentage points. */
const ZOOM_STEP = 0.05;

interface ImageFieldProps<T extends "logoPicker" | "backgroundPicker" | "photoPicker"> {
  field: Extract<EditorFieldSchema, { type: T }>;
  state: BannerSettings;
  onChange: (key: string, value: unknown) => void;
  onError: (message: string) => number;
  onErrorResolved: (toastId: number) => void;
}

/** The logo picker. Its size slider shows inside it once there's a logo. */
export function LogoField({
  sizeField,
  ...props
}: ImageFieldProps<"logoPicker"> & { sizeField: EditorFieldSchema | undefined }) {
  const { field, state, onChange } = props;
  const logo = fieldValue(state, field);
  return (
    <ImagePicker
      id={field.key}
      label={fieldLabel(field)}
      menuLabel="Logo options"
      policy={LOGO_UPLOAD}
      value={logo}
      onChange={(next) => onChange(field.key, next)}
      onError={props.onError}
      onErrorResolved={props.onErrorResolved}
      labelAction={
        // Only once the logo has been moved in the preview.
        logo && !isDefaultLogoPosition(state) ? (
          <ResetButton
            label="Reset logo position"
            onClick={() => onChange("logoPosition", undefined)}
          />
        ) : null
      }
    >
      {logo && sizeField ? (
        <Select
          label={fieldLabel(sizeField)}
          value={state.logoSize}
          options={sizeField.options ?? []}
          onChange={(value) => onChange("logoSize", value)}
        />
      ) : null}
    </ImagePicker>
  );
}

/** The intro banner's photo. */
export function PhotoField({ field, state, onChange, ...props }: ImageFieldProps<"photoPicker">) {
  return (
    <ImagePicker
      id={field.key}
      label={fieldLabel(field)}
      menuLabel="Photo options"
      policy={PHOTO_UPLOAD}
      value={fieldValue(state, field)}
      onChange={(next) => onChange(field.key, next)}
      onError={props.onError}
      onErrorResolved={props.onErrorResolved}
    />
  );
}

/**
 * The background picker. Its zoom and opacity sliders show inside it once the background can be
 * adjusted. The image is moved by dragging it in the preview (BackgroundDragSurface).
 */
export function BackgroundField({
  background,
  ...props
}: ImageFieldProps<"backgroundPicker"> & { background: BannerBackground | undefined }) {
  const { field, state, onChange } = props;
  return (
    <ImagePicker
      id={field.key}
      label={fieldLabel(field)}
      menuLabel="Background options"
      presets={BACKGROUND_PRESETS}
      policy={BACKGROUND_UPLOAD}
      value={fieldValue(state, field)}
      onChange={(next) => onChange(field.key, next)}
      onError={props.onError}
      onErrorResolved={props.onErrorResolved}
      labelAction={
        // Only once the image has been moved in the preview.
        background && !isDefaultBackgroundPosition(background) ? (
          <ResetButton label="Reset" onClick={() => onChange("backgroundPosition", undefined)} />
        ) : null
      }
    >
      {background ? (
        <>
          <RangeField
            id={`${field.key}-zoom`}
            label="Zoom"
            min={MIN_BACKGROUND_ZOOM}
            max={MAX_BACKGROUND_ZOOM}
            step={ZOOM_STEP}
            value={background.zoom}
            valueText={`${Math.round(background.zoom * 100)}%`}
            onChange={(zoom) => onChange("backgroundZoom", zoom)}
          />
          <RangeField
            id={`${field.key}-opacity`}
            label="Opacity"
            min={0}
            max={100}
            value={background.opacity}
            valueText={`${background.opacity}%`}
            onChange={(opacity) => onChange("backgroundOpacity", opacity)}
          />
        </>
      ) : null}
    </ImagePicker>
  );
}
