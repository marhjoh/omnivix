"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Link2 } from "lucide-react";
import { BACKGROUND_PRESETS, groupPresets, presetBySrc } from "@/src/backgrounds/presets";
import { useImageStatus } from "@/src/studio/preview/useImageStatus";
import { isHttpImageUrl, isInsecureImageLink } from "@/src/lib/imageLink";
import { normalizeBackgroundImageFile, truncateMiddle } from "@/src/lib/backgroundImageUpload";
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
  "image/png,image/jpeg,image/webp,image/avif,image/heic,image/heif,.png,.jpg,.jpeg,.webp,.avif,.heic,.heif";

function isDataUrl(s: string) {
  return s.startsWith("data:");
}

const TRIGGER_LABEL_MAX = 44;

const GROUPED_PRESETS = groupPresets(BACKGROUND_PRESETS);

/** How long the link field must be idle before a link that can't be used is reported. */
const LINK_SETTLE_MS = 1000;

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

export function BackgroundImagePicker({
  id,
  label,
  value,
  onChange,
  onError,
  onErrorResolved,
}: {
  id: string;
  label: string;
  value: string | undefined;
  onChange: (next: string | undefined) => void;
  /** An upload was rejected, or an image link can't be used; shown as a toast. Returns its id. */
  onError: (message: string) => number;
  /** Hides the toast with this id (a reported link was changed or now works). */
  onErrorResolved: (toastId: number) => void;
}) {
  const dropdown = useDropdown(id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [urlEditorOpen, setUrlEditorOpen] = useState(false);
  /** Filename for the current data URL when this picker performed the upload (parent state is only the URL). */
  const [uploadSession, setUploadSession] = useState<{ dataUrl: string; fileName: string } | null>(
    null,
  );
  /** `undefined` = show parent `value` when it is an HTTP URL; otherwise local typing draft */
  const [urlDraft, setUrlDraft] = useState<string | undefined>(undefined);
  /** The link the user has stopped typing (idle, Enter or leaving the field); only it is reported. */
  const [settledLink, setSettledLink] = useState<string | undefined>(undefined);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The link a toast is showing for, so each link is reported once and its toast can be hidden. */
  const reportedRef = useRef<{ link: string; toastId: number } | null>(null);

  /** The current background when it's an image link. */
  const linkValue = typeof value === "string" && isHttpImageUrl(value) ? value.trim() : undefined;
  const showUrlField = urlEditorOpen || linkValue !== undefined;
  const linkStatus = useImageStatus(linkValue);
  // A link that can't be exported (not a link at all, http, or one the browser can't load) is left
  // out of the preview (see StudioShell) and reported once the user has stopped typing it.
  const linkProblem = !settledLink
    ? null
    : !isHttpImageUrl(settledLink) || isInsecureImageLink(settledLink)
      ? "Use an https:// image link."
      : settledLink === linkValue && linkStatus === "failed"
        ? "Couldn't load this image link."
        : null;

  // A settled link that isn't the background yet. It becomes the background once the browser has
  // loaded it or it has failed (an http link right away); until then the banner keeps the
  // background it has, so typing never makes it flicker.
  const pendingLink =
    settledLink && isHttpImageUrl(settledLink) && settledLink !== linkValue
      ? settledLink
      : undefined;
  const pendingStatus = useImageStatus(
    pendingLink && !isInsecureImageLink(pendingLink) ? pendingLink : undefined,
  );
  useEffect(() => {
    if (!pendingLink) return;
    if (
      isInsecureImageLink(pendingLink) ||
      pendingStatus === "loaded" ||
      pendingStatus === "failed"
    ) {
      onChange(pendingLink);
    }
  }, [pendingLink, pendingStatus, onChange]);

  useEffect(() => {
    const reported = reportedRef.current;
    // The reported link was changed, or works now: its toast is out of date.
    if (reported && (reported.link !== settledLink || !linkProblem)) {
      onErrorResolved(reported.toastId);
      reportedRef.current = null;
    }
    if (linkProblem && settledLink && !reportedRef.current) {
      reportedRef.current = { link: settledLink, toastId: onError(linkProblem) };
    }
  }, [linkProblem, settledLink, onError, onErrorResolved]);

  const urlInputValue = urlDraft ?? linkValue ?? "";

  useEffect(() => {
    if (urlEditorOpen && urlInputRef.current) {
      requestAnimationFrame(() => urlInputRef.current?.focus());
    }
  }, [urlEditorOpen]);

  useEffect(() => {
    return () => {
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    };
  }, []);

  // uploadSession only ever holds a data URL, so a match means the background is that upload.
  const uploadDisplayName =
    uploadSession && uploadSession.dataUrl === value ? uploadSession.fileName : null;

  /** The user has stopped typing: an emptied field removes the background, a link is checked. */
  const settle = useCallback(
    (raw: string) => {
      const link = raw.trim();
      setSettledLink(link);
      if (!link) onChange(undefined);
    },
    [onChange],
  );

  const onUrlChange = (raw: string) => {
    setUrlDraft(raw);
    if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    settleTimeoutRef.current = setTimeout(() => settle(raw), LINK_SETTLE_MS);
  };

  /** Enter or leaving the field: check the link now, without waiting for the pause. */
  const settleUrl = () => {
    if (urlDraft === undefined) return;
    if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    settle(urlDraft);
  };

  /** A preset, or no background (`undefined`). */
  const select = (src: string | undefined) => {
    setSettledLink(undefined);
    setUploadSession(null);
    onChange(src);
    setUrlDraft(undefined);
    setUrlEditorOpen(false);
    dropdown.close();
  };

  const selectEnterUrl = () => {
    setUrlEditorOpen(true);
    dropdown.close();
    setUrlDraft(linkValue ? undefined : "");
  };

  const selectUpload = () => {
    setSettledLink(undefined);
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
        <DropdownTrigger dropdown={dropdown}>
          {triggerLabel(value, uploadDisplayName)}
        </DropdownTrigger>

        <DropdownList dropdown={dropdown} label="Background options">
          <DropdownOption selected={!value} onSelect={() => select(undefined)}>
            None
          </DropdownOption>

          {Array.from(GROUPED_PRESETS.entries()).map(([groupName, presets]) => (
            <div key={groupName}>
              <DropdownGroupLabel>{groupName}</DropdownGroupLabel>
              {presets.map((p) => (
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
            selected={linkValue !== undefined}
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
            if (!file) return;
            setUrlDraft(undefined);
            setUrlEditorOpen(false);
            const result = await normalizeBackgroundImageFile(file);
            if (!result.ok) {
              onError(result.error);
              return;
            }
            setUploadSession({ dataUrl: result.dataUrl, fileName: file.name });
            onChange(result.dataUrl);
          }}
        />
      </DropdownRoot>

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
            onBlur={settleUrl}
            onKeyDown={(e) => e.key === "Enter" && settleUrl()}
          />
        </div>
      ) : null}
    </div>
  );
}
