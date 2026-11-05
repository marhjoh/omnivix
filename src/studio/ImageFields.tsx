import { BACKGROUND_PRESETS } from "@/src/backgrounds/presets";
import {
  isDefaultBackgroundPosition,
  MAX_BACKGROUND_ZOOM,
  MIN_BACKGROUND_ZOOM,
  type BannerBackground,
} from "@/src/banner/background";
import { DEFAULT_LOGO_SIZE, isDefaultLogoPosition } from "@/src/banner/logo";
import { BACKGROUND_UPLOAD, LOGO_UPLOAD } from "@/src/lib/imageUpload";
import { ImagePicker } from "@/src/studio/ImagePicker";
import { ResetButton } from "@/src/studio/ResetButton";
import { fieldLabel } from "@/src/studio/settingGroups";
import type { EditorFieldSchema } from "@/src/templates/types";
import { Select } from "@/src/ui/Dropdown";
import { RangeField } from "@/src/ui/RangeField";

/** Zoom slider step: 5 percentage points. */
const ZOOM_STEP = 0.05;

interface ImageFieldProps {
  field: EditorFieldSchema;
  state: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onError: (message: string) => number;
  onErrorResolved: (toastId: number) => void;
}

function imageValue(state: Record<string, unknown>, key: string): string | undefined {
  const value = state[key];
  return typeof value === "string" ? value : undefined;
}

/** The logo picker. Its size slider shows inside it once there's a logo. */
export function LogoField({
  sizeField,
  ...props
}: ImageFieldProps & { sizeField: EditorFieldSchema | undefined }) {
  const { field, state, onChange } = props;
  const logo = imageValue(state, field.key);
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
          value={String(state.logoSize ?? DEFAULT_LOGO_SIZE)}
          options={sizeField.options ?? []}
          onChange={(value) => onChange("logoSize", value)}
        />
      ) : null}
    </ImagePicker>
  );
}

/**
 * The background picker. Its zoom and opacity sliders show inside it once the background can be
 * adjusted. The image is moved by dragging it in the preview (BackgroundDragSurface).
 */
export function BackgroundField({
  background,
  ...props
}: ImageFieldProps & { background: BannerBackground | undefined }) {
  const { field, state, onChange } = props;
  return (
    <ImagePicker
      id={field.key}
      label={fieldLabel(field)}
      menuLabel="Background options"
      presets={BACKGROUND_PRESETS}
      policy={BACKGROUND_UPLOAD}
      value={imageValue(state, field.key)}
      onChange={(next) => onChange(field.key, next)}
      onError={props.onError}
      onErrorResolved={props.onErrorResolved}
      labelAction={
        // Only once the image has been moved in the preview.
        background && !isDefaultBackgroundPosition(background) ? (
          <ResetButton
            label="Reset"
            onClick={() => onChange("backgroundPosition", undefined)}
          />
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
