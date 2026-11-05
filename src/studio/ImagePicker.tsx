"use client";

import { type ReactNode, useRef, useState } from "react";
import { ImagePlus, Link2 } from "lucide-react";
import { groupPresets } from "@/src/backgrounds/presets";
import { useDelayedFlag } from "@/src/ui/useDelayedFlag";
import { isDataUrl } from "@/src/lib/imageSource";
import type { ImageUploadPolicy } from "@/src/lib/imageUpload";
import { normalizeImageFile, uploadAccept } from "@/src/studio/imageUpload";
import { HTTPS, useImageLinkField } from "@/src/studio/useImageLinkField";
import { truncateMiddle } from "@/src/lib/text";
import {
  DropdownGroupLabel,
  DropdownRoot,
  DropdownList,
  DropdownOption,
  DropdownTrigger,
} from "@/src/ui/Dropdown";
import { useDropdown } from "@/src/ui/useDropdown";
import { FieldWrapper } from "@/src/ui/FieldLabel";
import { PrefixedInput } from "@/src/ui/PrefixedInput";

/** A built-in image, listed in the menu under its group. */
interface ImagePreset {
  id: string;
  label: string;
  group: string;
  src: string;
}

const TRIGGER_LABEL_MAX = 44;

function triggerLabel(
  value: string | undefined,
  uploadedFileName: string | null,
  presets: readonly ImagePreset[],
): string {
  if (!value) return "None";
  if (isDataUrl(value)) {
    const name = uploadedFileName?.trim();
    return name ? truncateMiddle(name, TRIGGER_LABEL_MAX) : "Uploaded image";
  }
  // Anything else is a link (see isSavableImage); the link itself shows in the field below.
  return presets.find((p) => p.src === value)?.label ?? "Image from URL";
}

const NO_PRESETS: readonly ImagePreset[] = [];

/**
 * An image setting (the background, the logo): None, built-in images if any, a link, or an upload
 * from the device, processed under `policy`.
 */
export function ImagePicker({
  id,
  label,
  menuLabel,
  presets = NO_PRESETS,
  policy,
  value,
  onChange,
  onError,
  onErrorResolved,
  labelAction,
  children,
}: {
  id: string;
  label: string;
  /** Names the menu for screen readers, e.g. "Background options". */
  menuLabel: string;
  presets?: readonly ImagePreset[];
  policy: ImageUploadPolicy;
  value: string | undefined;
  onChange: (next: string | undefined) => void;
  /** An upload was rejected, or an image link can't be used; shown as a toast. Returns its id. */
  onError: (message: string) => number;
  /** Hides the toast with this id (a reported link was changed or now works). */
  onErrorResolved: (toastId: number) => void;
  /** A small action at the end of the label row (the sidebar's Reset). */
  labelAction?: ReactNode;
  /** Controls for the chosen image, joined under the picker as one frame. */
  children?: ReactNode;
}) {
  const dropdown = useDropdown(id);
  const groupedPresets = groupPresets(presets);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** The upload's file name, when this picker made it (the parent only has the data URL). */
  const [uploadSession, setUploadSession] = useState<{ dataUrl: string; fileName: string } | null>(
    null,
  );
  /**
   * The upload being converted and scaled (seconds for a large photo), shown in the trigger; null
   * when it's done or another choice replaced it. Not a transition: its pending state would stay
   * on until replaced uploads had finished too.
   */
  const [processingFile, setProcessingFile] = useState<File | null>(null);
  /** The latest chosen file, so a slower earlier upload can't replace it. */
  const latestUploadRef = useRef<File | null>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const link = useImageLinkField({
    value,
    onChange,
    onError,
    onErrorResolved,
    inputRef: linkInputRef,
  });
  const joined = link.shown || Boolean(children);

  // The spinner can outlast the upload (useDelayedFlag's minimum show time); the label then
  // already shows the result.
  const showUploading = useDelayedFlag(processingFile !== null);
  const uploadingName = showUploading ? (processingFile?.name ?? null) : null;

  // uploadSession only ever holds a data URL, so a match means the image is that upload.
  const uploadDisplayName =
    uploadSession && uploadSession.dataUrl === value ? uploadSession.fileName : null;

  /** Another choice replaces an upload still being processed. */
  const cancelUpload = () => {
    latestUploadRef.current = null;
    setProcessingFile(null);
  };

  /** A preset, or no image (`undefined`). */
  const select = (src: string | undefined) => {
    cancelUpload();
    link.close();
    setUploadSession(null);
    onChange(src);
    dropdown.close();
  };

  const selectEnterUrl = () => {
    cancelUpload();
    link.open();
    dropdown.close();
  };

  const selectUpload = () => {
    link.close();
    fileInputRef.current?.click();
    dropdown.close();
  };

  return (
    <FieldWrapper label={label} htmlFor={id} end={labelAction}>
      <div>
        <DropdownRoot dropdown={dropdown} className="relative">
          <DropdownTrigger dropdown={dropdown} joinedBelow={joined} busy={showUploading}>
            {uploadingName !== null
              ? truncateMiddle(uploadingName, TRIGGER_LABEL_MAX)
              : triggerLabel(value, uploadDisplayName, presets)}
          </DropdownTrigger>

          <DropdownList dropdown={dropdown} label={menuLabel}>
            <DropdownOption selected={!value} onSelect={() => select(undefined)}>
              None
            </DropdownOption>

            {Array.from(groupedPresets.entries()).map(([groupName, group]) => (
              <div key={groupName}>
                <DropdownGroupLabel>{groupName}</DropdownGroupLabel>
                {group.map((p) => (
                  <DropdownOption
                    key={p.id}
                    selected={value === p.src}
                    onSelect={() => select(p.src)}
                  >
                    {p.label}
                  </DropdownOption>
                ))}
              </div>
            ))}

            <div className="my-1 border-t border-border" />

            <DropdownOption
              selected={link.linkValue !== undefined}
              icon={<Link2 className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />}
              onSelect={selectEnterUrl}
            >
              Image from URL
            </DropdownOption>
            <DropdownOption
              selected={Boolean(value && isDataUrl(value))}
              icon={<ImagePlus className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />}
              onSelect={selectUpload}
            >
              Upload from device
            </DropdownOption>
          </DropdownList>
          {/*
            Keep this input mounted outside the dropdown: closing the menu unmounts the list, but
            the same node must stay in the document until the user finishes the OS file picker or
            change events can be dropped.
          */}
          <input
            ref={fileInputRef}
            type="file"
            accept={uploadAccept(policy)}
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              latestUploadRef.current = file;
              setProcessingFile(file);
              const result = await normalizeImageFile(file, policy);
              if (latestUploadRef.current !== file) return;
              setProcessingFile(null);
              if (!result.ok) {
                onError(result.error);
                return;
              }
              setUploadSession({ dataUrl: result.dataUrl, fileName: file.name });
              onChange(result.dataUrl);
            }}
          />
        </DropdownRoot>
        {joined ? (
          // Shares the trigger's bottom border, so the picker, its link field and the image's
          // controls read as one frame. The open list covers it.
          <div className="field-attached space-y-3 p-3">
            {link.shown ? (
              <FieldWrapper label="Image URL" htmlFor={`${id}-url`}>
                <PrefixedInput
                  ref={linkInputRef}
                  id={`${id}-url`}
                  prefix={HTTPS}
                  inputMode="url"
                  autoComplete="url"
                  value={link.inputProps.value}
                  onChange={(e) => link.inputProps.onChange(e.target.value)}
                  onBlur={link.inputProps.onBlur}
                  onKeyDown={(e) => e.key === "Enter" && link.inputProps.onEnter()}
                  clearLabel="Remove image link"
                  onClear={link.inputProps.onClear}
                />
              </FieldWrapper>
            ) : null}
            {children}
          </div>
        ) : null}
      </div>
    </FieldWrapper>
  );
}
