"use client";

import { BACKGROUND_PRESETS } from "@/src/backgrounds/presets";
import { isDefaultBackgroundFraming, type BannerBackground } from "@/src/banner/background";
import { DEFAULT_LOGO_SIZE, isDefaultLogoPosition } from "@/src/banner/logo";
import { BACKGROUND_UPLOAD, LOGO_UPLOAD } from "@/src/lib/imageUpload";
import { BackgroundZoomControl } from "@/src/studio/BackgroundZoomControl";
import { ImagePicker } from "@/src/studio/ImagePicker";
import { ResetButton } from "@/src/studio/ResetButton";
import { fieldLabel } from "@/src/studio/settingGroups";
import type { EditorFieldSchema } from "@/src/types/template";
import { Select } from "@/src/ui/Dropdown";

/** What both image settings need besides their own value. */
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

/** The logo, with its size inside the picker once there's one. */
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

/** The background, with its zoom inside the picker once it can be adjusted. */
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
        // Only once the image has been moved or zoomed in the preview.
        background && !isDefaultBackgroundFraming(background) ? (
          <ResetButton
            label="Reset position and zoom"
            onClick={() => {
              onChange("backgroundPosition", undefined);
              onChange("backgroundZoom", undefined);
            }}
          />
        ) : null
      }
    >
      {background ? (
        <BackgroundZoomControl
          id={field.key}
          zoom={background.zoom}
          onZoomChange={(zoom) => onChange("backgroundZoom", zoom)}
        />
      ) : null}
    </ImagePicker>
  );
}
