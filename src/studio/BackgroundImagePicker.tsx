"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, ImagePlus, Link2 } from "lucide-react";
import { BACKGROUND_PRESETS, groupPresets, presetBySrc } from "@/src/backgrounds/presets";
import { fileToDataUrl } from "@/src/lib/images";

function isHttpImageUrl(s: string) {
  return /^https?:\/\//i.test(s.trim());
}

function isDataUrl(s: string) {
  return s.startsWith("data:");
}

function triggerLabel(value: string | undefined): string {
  if (!value) return "None";
  if (isDataUrl(value)) return "Uploaded image";
  const preset = presetBySrc(value);
  if (preset) return preset.label;
  if (isHttpImageUrl(value)) return "Enter your own URL";
  return "Custom";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [urlEditorOpen, setUrlEditorOpen] = useState(false);
  /** `undefined` = show parent `value` when it is an HTTP URL; otherwise local typing draft */
  const [urlDraft, setUrlDraft] = useState<string | undefined>(undefined);
  const urlTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        onChange(undefined);
        setUrlDraft(undefined);
        return;
      }
      if (isHttpImageUrl(t)) {
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
    onChange(undefined);
    setUrlDraft(undefined);
    setUrlEditorOpen(false);
    setOpen(false);
  };

  const selectPreset = (src: string) => {
    onChange(src);
    setUrlDraft(undefined);
    setUrlEditorOpen(false);
    setOpen(false);
  };

  const selectEnterUrl = () => {
    setUrlEditorOpen(true);
    setOpen(false);
    if (typeof value === "string" && isHttpImageUrl(value)) {
      setUrlDraft(undefined);
    } else {
      setUrlDraft("");
    }
  };

  const selectUpload = () => {
    setUrlDraft(undefined);
    setUrlEditorOpen(false);
    fileInputRef.current?.click();
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative space-y-1.5">
      <span className="block text-xs font-medium text-muted">{label}</span>

      <div className="relative">
        <button
          type="button"
          id={id}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-surface-2 px-3 py-[9px] text-left text-sm text-text transition-colors hover:border-border focus:outline-none focus:ring-2 focus:ring-[rgba(47,129,247,0.15)] focus:border-[var(--accent)]"
        >
          <span className="min-w-0 flex-1 truncate">{triggerLabel(value)}</span>
          {open ? (
            <ChevronUp className="h-4 w-4 shrink-0 self-center opacity-60" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 self-center opacity-60" aria-hidden />
          )}
        </button>

        {open ? (
          <div
            id={listId}
            role="listbox"
            aria-label="Background options"
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-surface-2 py-1 shadow-lg"
          >
          <button
            type="button"
            role="option"
            aria-selected={!value}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text hover:bg-surface"
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
                    aria-selected={selected}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text hover:bg-surface"
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
            aria-selected={Boolean(value && isHttpImageUrl(value))}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text hover:bg-surface"
            onClick={selectEnterUrl}
          >
            {value && isHttpImageUrl(value) ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
            ) : (
              <Link2 className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
            )}
            Enter your own URL
          </button>
          <button
            type="button"
            role="option"
            aria-selected={Boolean(value && isDataUrl(value))}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text hover:bg-surface"
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
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setUrlDraft(undefined);
            setUrlEditorOpen(false);
            onChange(await fileToDataUrl(file));
          }}
        />
      </div>

      {showUrlField ? (
        <div className="space-y-1">
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
        </div>
      ) : null}
    </div>
  );
}
