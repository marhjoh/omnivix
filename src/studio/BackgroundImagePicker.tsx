"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, ImagePlus, Link2 } from "lucide-react";
import { BACKGROUND_PRESETS, groupPresets, presetBySrc } from "@/src/backgrounds/presets";
import {
  MAX_BACKGROUND_UPLOAD_BYTES,
  normalizeBackgroundImageFile,
  truncateMiddle,
} from "@/src/lib/backgroundImageUpload";

/** `accept` hint only — validation runs in `normalizeBackgroundImageFile`. */
export const BACKGROUND_FILE_ACCEPT =
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

function triggerTitle(value: string | undefined, uploadedFileName: string | null): string | undefined {
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
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [urlEditorOpen, setUrlEditorOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  /** Filename for the current data URL when this picker performed the upload (parent state is only the URL). */
  const [uploadSession, setUploadSession] = useState<{ dataUrl: string; fileName: string } | null>(
    null,
  );
  /** `undefined` = show parent `value` when it is an HTTP URL; otherwise local typing draft */
  const [urlDraft, setUrlDraft] = useState<string | undefined>(undefined);
  const urlTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Tracks whether the dropdown was closed via Tab so we don't steal focus from the natural tab target. */
  const closedByTabRef = useRef(false);
  const prevOpenRef = useRef(false);

  const showUrlField =
    urlEditorOpen || (typeof value === "string" && isHttpImageUrl(value));

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

  /** Focus the selected (or first) option when the dropdown opens. */
  useEffect(() => {
    if (!open || !listboxRef.current) return;
    const options = Array.from(
      listboxRef.current.querySelectorAll<HTMLElement>('[role="option"]'),
    );
    const selected =
      options.find((el) => el.getAttribute("aria-selected") === "true") ?? options[0];
    requestAnimationFrame(() => selected?.focus());
  }, [open]);

  /** Return focus to the trigger when the dropdown closes, unless it closed via Tab. */
  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;
    if (wasOpen && !open && !closedByTabRef.current) {
      triggerRef.current?.focus();
    }
    closedByTabRef.current = false;
  }, [open]);

  const uploadDisplayName =
    typeof value === "string" &&
    isDataUrl(value) &&
    uploadSession?.dataUrl === value
      ? uploadSession.fileName
      : null;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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

  /** Keyboard handler for the listbox — implements full arrow/Home/End/Escape/Tab interaction. */
  const handleListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const listbox = listboxRef.current;
    if (!listbox) return;
    const options = Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"]'));
    const currentIdx = options.indexOf(document.activeElement as HTMLElement);

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = currentIdx < options.length - 1 ? currentIdx + 1 : 0;
        options[next]?.focus();
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = currentIdx > 0 ? currentIdx - 1 : options.length - 1;
        options[prev]?.focus();
        break;
      }
      case "Home": {
        e.preventDefault();
        options[0]?.focus();
        break;
      }
      case "End": {
        e.preventDefault();
        options[options.length - 1]?.focus();
        break;
      }
      case "Escape": {
        setOpen(false);
        break;
      }
      case "Tab": {
        closedByTabRef.current = true;
        setOpen(false);
        break;
      }
    }
  };

  const selectNone = () => {
    setUploadError(null);
    setUploadSession(null);
    onChange(undefined);
    setUrlDraft(undefined);
    setUrlEditorOpen(false);
    setOpen(false);
  };

  const selectPreset = (src: string) => {
    setUploadError(null);
    setUploadSession(null);
    onChange(src);
    setUrlDraft(undefined);
    setUrlEditorOpen(false);
    setOpen(false);
  };

  const selectEnterUrl = () => {
    setUploadError(null);
    setUrlEditorOpen(true);
    setOpen(false);
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
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-muted">
        {label}
      </label>

      <div className="relative space-y-1.5">
        <button
          type="button"
          id={id}
          ref={triggerRef}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-surface-2 px-3 py-[9px] text-left text-sm text-text transition-colors hover:border-border focus:outline-none focus:ring-2 focus:ring-[rgba(47,129,247,0.15)] focus:border-[var(--accent)]"
        >
          <span
            className="min-w-0 flex-1 truncate"
            title={triggerTitle(value, uploadDisplayName)}
          >
            {triggerLabel(value, uploadDisplayName)}
          </span>
          {open ? (
            <ChevronUp className="h-4 w-4 shrink-0 self-center opacity-60" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 self-center opacity-60" aria-hidden />
          )}
        </button>

        {open ? (
          <div
            id={listId}
            ref={listboxRef}
            role="listbox"
            aria-label="Background options"
            onKeyDown={handleListKeyDown}
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-surface-2 py-1 shadow-lg"
          >
            <button
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={!value}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text hover:bg-surface focus:bg-surface focus:outline-none"
              onClick={selectNone}
            >
              {!value ? <Check className="h-3.5 w-3.5 shrink-0 text-accent" /> : <span className="w-3.5 shrink-0" />}
              None
            </button>

            {Array.from(grouped.entries()).map(([groupName, presets]) => (
              <div key={groupName}>
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {groupName}
                </div>
                {presets.map((p) => {
                  const selected = value === p.src;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="option"
                      tabIndex={-1}
                      aria-selected={selected}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text hover:bg-surface focus:bg-surface focus:outline-none"
                      onClick={() => selectPreset(p.src)}
                    >
                      {selected ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                      ) : (
                        <span className="w-3.5 shrink-0" />
                      )}
                      {p.label}
                    </button>
                  );
                })}
              </div>
            ))}

            <div className="my-1 border-t border-border" />

            <button
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={Boolean(value && isHttpImageUrl(value))}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text hover:bg-surface focus:bg-surface focus:outline-none"
              onClick={selectEnterUrl}
            >
              {value && isHttpImageUrl(value) ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
              ) : (
                <Link2 className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
              )}
              Image from URL
            </button>
            <button
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={Boolean(value && isDataUrl(value))}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text hover:bg-surface focus:bg-surface focus:outline-none"
              onClick={selectUpload}
            >
              {value && isDataUrl(value) ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
              )}
              Upload from device
            </button>
          </div>
        ) : null}
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
      </div>

      {uploadError ? (
        <p className="text-xs leading-snug text-danger" role="alert">
          {uploadError}
        </p>
      ) : null}

      <p className="text-[11px] leading-snug text-muted">
        Formats: PNG, JPEG, WebP, HEIC. 
        Max: {MAX_BACKGROUND_UPLOAD_BYTES / (1024 * 1024)} MB.
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
