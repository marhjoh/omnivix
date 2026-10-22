"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Link2, X } from "lucide-react";
import { BACKGROUND_PRESETS, groupPresets, presetBySrc } from "@/src/backgrounds/presets";
import { useImageStatus } from "@/src/studio/preview/useImageStatus";
import { isHttpImageUrl } from "@/src/lib/imageLink";
import { normalizeBackgroundImageFile, truncateMiddle } from "@/src/lib/backgroundImageUpload";
import {
  DropdownGroupLabel,
  DropdownRoot,
  DropdownList,
  DropdownOption,
  DropdownTrigger,
  useDropdown,
} from "@/src/ui/Dropdown";
import { FieldLabel } from "@/src/ui/FieldLabel";

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

/** The link field starts with this, fixed: the export only loads https images. */
const HTTPS = "https://";

/** What the link field holds after its fixed "https://": a pasted link loses its scheme. */
function withoutScheme(link: string): string {
  return link.trim().replace(/^https?:\/\//i, "");
}

function triggerLabel(value: string | undefined, uploadedFileName: string | null): string {
  if (!value) return "None";
  if (isDataUrl(value)) {
    const name = uploadedFileName?.trim();
    return name ? truncateMiddle(name, TRIGGER_LABEL_MAX) : "Uploaded image";
  }
  const preset = presetBySrc(value);
  if (preset) return preset.label;
  // The link itself shows in the field below the picker.
  if (isHttpImageUrl(value)) return "Image from URL";
  return "Custom";
}

export function BackgroundImagePicker({
  id,
  label,
  value,
  onChange,
  onError,
  onErrorResolved,
  labelAction,
  children,
}: {
  id: string;
  label: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [urlEditorOpen, setUrlEditorOpen] = useState(false);
  /** Filename for the current data URL when this picker performed the upload (parent state is only the URL). */
  const [uploadSession, setUploadSession] = useState<{ dataUrl: string; fileName: string } | null>(
    null,
  );
  /** What's typed after "https://"; `undefined` shows the current link (`value`) instead. */
  const [urlDraft, setUrlDraft] = useState<string | undefined>(undefined);
  /** The link the user has stopped typing (idle, Enter or leaving the field); only it is reported. */
  const [settledLink, setSettledLink] = useState<string | undefined>(undefined);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The link a toast is showing for, so each link is reported once and its toast can be hidden. */
  const reportedRef = useRef<{ link: string; toastId: number } | null>(null);

  /** The current background when it's an image link. */
  const linkValue = typeof value === "string" && isHttpImageUrl(value) ? value.trim() : undefined;
  const showUrlField = urlEditorOpen || linkValue !== undefined;
  const joined = showUrlField || Boolean(children);
  const linkStatus = useImageStatus(linkValue);
  // A link the browser can't load is left out of the preview (see StudioShell) and reported once
  // the user has stopped typing it.
  const linkProblem =
    settledLink && settledLink === linkValue && linkStatus === "failed"
      ? "Couldn't load this image link."
      : null;

  // A settled link that isn't the background yet. It becomes the background once the browser has
  // loaded it or it has failed; until then the banner keeps the background it has, so typing never
  // makes it flicker.
  const pendingLink = settledLink && settledLink !== linkValue ? settledLink : undefined;
  const pendingStatus = useImageStatus(pendingLink);
  useEffect(() => {
    if (pendingLink && (pendingStatus === "loaded" || pendingStatus === "failed")) {
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

  const urlInputValue = urlDraft ?? (linkValue ? withoutScheme(linkValue) : "");

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

  /**
   * The user has stopped typing: a link is checked, and an emptied field removes the background if
   * that was a link. A preset or upload stays when the field is opened and left empty.
   */
  const settle = useCallback(
    (draft: string) => {
      const rest = withoutScheme(draft);
      const link = rest ? HTTPS + rest : "";
      setSettledLink(link);
      if (!link && linkValue) onChange(undefined);
    },
    [onChange, linkValue],
  );

  const onUrlChange = (raw: string) => {
    // A pasted link loses its scheme, since the field already starts with https://.
    const draft = raw.replace(/^\s*https?:\/\//i, "");
    setUrlDraft(draft);
    if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    settleTimeoutRef.current = setTimeout(() => settle(draft), LINK_SETTLE_MS);
  };

  /**
   * The × button: the link and the background go, but the field stays open and focused, ready for
   * another link. Choosing something else in the menu closes it.
   */
  const removeLink = () => {
    if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    setUrlDraft("");
    setSettledLink(undefined);
    onChange(undefined);
    urlInputRef.current?.focus();
  };

  /**
   * Enter or leaving the field: check the link now, without waiting for the pause. Leaving never
   * closes the field (switching windows to copy a link would); only another choice in the menu does.
   */
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
    if (linkValue) {
      setUrlDraft(undefined);
      return;
    }
    // Start over with an empty field.
    setUrlDraft("");
    setSettledLink(undefined);
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
      <FieldLabel htmlFor={id} end={labelAction}>
        {label}
      </FieldLabel>

      <div>
        <DropdownRoot dropdown={dropdown} className="relative">
          <DropdownTrigger dropdown={dropdown} joinedBelow={joined}>
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
            Keep this input mounted outside the dropdown: closing the menu unmounts the list, but
            the same node must stay in the document until the user finishes the OS file picker or
            change events can be dropped.
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
        {joined ? (
          // Shares the trigger's bottom border, so the picker, its link field and the image's
          // controls read as one frame. The open list covers it.
          <div className="-mt-px space-y-3 rounded-b-lg border border-(--control-border) bg-surface p-3">
            {showUrlField ? (
              <div className="space-y-1.5">
                <FieldLabel htmlFor={`${id}-url`}>Image URL</FieldLabel>
                {/* One frame for the fixed https://, the field and its × (field-input's focus
                    ring shows while the field inside has focus). */}
                <div className="field-input flex items-center py-0 pr-1">
                  <span id={`${id}-url-scheme`} className="pr-1 text-muted select-none">
                    {HTTPS}
                  </span>
                  <input
                    ref={urlInputRef}
                    id={`${id}-url`}
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    spellCheck={false}
                    aria-describedby={`${id}-url-scheme`}
                    className="min-w-0 flex-1 bg-transparent py-[9px] outline-none"
                    value={urlInputValue}
                    onChange={(e) => onUrlChange(e.target.value)}
                    onBlur={settleUrl}
                    onKeyDown={(e) => e.key === "Enter" && settleUrl()}
                  />
                  {urlInputValue ? (
                    <button
                      type="button"
                      aria-label="Remove image link"
                      onClick={removeLink}
                      className="btn-ghost h-8 w-8 shrink-0 p-0"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
