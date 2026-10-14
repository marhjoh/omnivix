"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Link2 } from "lucide-react";
import { BACKGROUND_PRESETS, groupPresets, presetBySrc } from "@/src/backgrounds/presets";
import {
  MAX_BACKGROUND_UPLOAD_BYTES,
  normalizeBackgroundImageFile,
  truncateMiddle,
} from "@/src/lib/backgroundImageUpload";
import {
  DropdownGroupLabel,
  DropdownRoot,
  DropdownList,
  DropdownOption,
  DropdownTrigger,
  useDropdown,
} from "@/src/ui/Dropdown";

/** `accept` hint only — validation runs in `normalizeBackgroundImageFile`. */
const BACKGROUND_FILE_ACCEPT =
  "image/png,image/jpeg,image/webp,image/heic,image/heif,.png,.jpg,.jpeg,.webp,.heic,.heif";

function isHttpImageUrl(s: string) {
  return /^https?:\/\//i.test(s.trim());
}

function isDataUrl(s: string) {
  return s.startsWith("data:");
}

const TRIGGER_LABEL_MAX = 44;

function triggerLabel(value: string | undefined, uploadedFileName: string | null): string {
  if (!value) return "None";
  if (isDataUrl(value)) {
    const name = uploadedFileName?.trim();
    return name ? truncateMiddle(name, TRIGGER_LABEL_MAX) : "Uploaded image";
  }
  const preset = presetBySrc(value);
  if (preset) return preset.label;
  if (isHttpImageUrl(value)) return truncateMiddle(value.trim(), TRIGGER_LABEL_MAX);
  return "Custom";
}

function triggerTitle(
  value: string | undefined,
  uploadedFileName: string | null,
): string | undefined {
  if (!value) return undefined;
  if (isDataUrl(value)) {
    const name = uploadedFileName?.trim();
    return name || undefined;
  }
  return value;
}

export function BackgroundImagePicker({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string | undefined;
  onChange: (next: string | undefined) => void;
}) {
  const dropdown = useDropdown(id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [urlEditorOpen, setUrlEditorOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  /** Filename for the current data URL when this picker performed the upload (parent state is only the URL). */
  const [uploadSession, setUploadSession] = useState<{ dataUrl: string; fileName: string } | null>(
    null,
  );
  /** `undefined` = show parent `value` when it is an HTTP URL; otherwise local typing draft */
  const [urlDraft, setUrlDraft] = useState<string | undefined>(undefined);
  const urlTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showUrlField = urlEditorOpen || (typeof value === "string" && isHttpImageUrl(value));

  const urlInputValue =
    urlDraft !== undefined
      ? urlDraft
      : typeof value === "string" && isHttpImageUrl(value)
        ? value
        : "";

  useEffect(() => {
    if (urlEditorOpen && urlInputRef.current) {
      requestAnimationFrame(() => urlInputRef.current?.focus());
    }
  }, [urlEditorOpen]);

  useEffect(() => {
    return () => {
      if (urlTimeoutRef.current) clearTimeout(urlTimeoutRef.current);
    };
  }, []);

  const uploadDisplayName =
    typeof value === "string" && isDataUrl(value) && uploadSession?.dataUrl === value
      ? uploadSession.fileName
      : null;

  const pushUrlToParent = useCallback(
    (raw: string) => {
      const t = raw.trim();
      if (!t) {
        setUploadSession(null);
        onChange(undefined);
        setUrlDraft(undefined);
        return;
      }
      if (isHttpImageUrl(t)) {
        setUploadSession(null);
        onChange(t);
        setUrlDraft(undefined);
      }
    },
    [onChange],
  );

  const onUrlChange = (raw: string) => {
    setUrlDraft(raw);
    if (urlTimeoutRef.current) clearTimeout(urlTimeoutRef.current);
    urlTimeoutRef.current = setTimeout(() => pushUrlToParent(raw), 400);
  };

  const grouped = groupPresets(BACKGROUND_PRESETS);

  const selectNone = () => {
    setUploadError(null);
    setUploadSession(null);
    onChange(undefined);
    setUrlDraft(undefined);
    setUrlEditorOpen(false);
    dropdown.close();
  };

  const selectPreset = (src: string) => {
    setUploadError(null);
    setUploadSession(null);
    onChange(src);
    setUrlDraft(undefined);
    setUrlEditorOpen(false);
    dropdown.close();
  };

  const selectEnterUrl = () => {
    setUploadError(null);
    setUrlEditorOpen(true);
    dropdown.close();
    if (typeof value === "string" && isHttpImageUrl(value)) {
      setUrlDraft(undefined);
    } else {
      setUrlDraft("");
    }
  };

  const selectUpload = () => {
    setUploadError(null);
    setUrlDraft(undefined);
    setUrlEditorOpen(false);
    fileInputRef.current?.click();
    dropdown.close();
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-muted">
        {label}
      </label>

      <DropdownRoot dropdown={dropdown} className="relative space-y-1.5">
        <DropdownTrigger dropdown={dropdown} title={triggerTitle(value, uploadDisplayName)}>
          {triggerLabel(value, uploadDisplayName)}
        </DropdownTrigger>

        <DropdownList dropdown={dropdown} label="Background options">
          <DropdownOption selected={!value} onSelect={selectNone}>
            None
          </DropdownOption>

          {Array.from(grouped.entries()).map(([groupName, presets]) => (
            <div key={groupName}>
              <DropdownGroupLabel>{groupName}</DropdownGroupLabel>
              {presets.map((p) => (
                <DropdownOption
                  key={p.id}
                  selected={value === p.src}
                  onSelect={() => selectPreset(p.src)}
                >
                  {p.label}
                </DropdownOption>
              ))}
            </div>
          ))}

          <div className="my-1 border-t border-border" />

          <DropdownOption
            selected={Boolean(value && isHttpImageUrl(value))}
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
          Keep this input mounted outside the dropdown: closing the menu unmounts the list, but the
          same node must stay in the document until the user finishes the OS file picker or change
          events can be dropped.
        */}
        <input
          ref={fileInputRef}
          type="file"
          accept={BACKGROUND_FILE_ACCEPT}
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            setUploadError(null);
            if (!file) return;
            setUrlDraft(undefined);
            setUrlEditorOpen(false);
            const result = await normalizeBackgroundImageFile(file);
            if (!result.ok) {
              setUploadError(result.error);
              return;
            }
            setUploadSession({ dataUrl: result.dataUrl, fileName: file.name });
            onChange(result.dataUrl);
          }}
        />
      </DropdownRoot>

      {uploadError ? (
        <p className="text-xs leading-snug text-danger" role="alert">
          {uploadError}
        </p>
      ) : null}

      <p className="text-[11px] leading-snug text-muted">
        Formats: PNG, JPEG, WebP, HEIC. Max: {MAX_BACKGROUND_UPLOAD_BYTES / (1024 * 1024)} MB.
      </p>

      {showUrlField ? (
        <div className="space-y-1.5">
          <label htmlFor={`${id}-url`} className="block text-xs font-medium text-muted">
            Image URL
          </label>
          <input
            ref={urlInputRef}
            id={`${id}-url`}
            type="url"
            inputMode="url"
            placeholder="Enter the link to your image…"
            className="field-input text-xs"
            value={urlInputValue}
            onChange={(e) => onUrlChange(e.target.value)}
          />
          <p className="text-[11px] leading-snug text-muted">
            Note: Other sites may block hotlinking.
          </p>
        </div>
      ) : null}
    </div>
  );
}
