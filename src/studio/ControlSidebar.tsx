"use client";

import { useState, useEffect, useRef } from "react";
import { BANNER_SIZES } from "@/src/lib/sizes";
import { EditorFieldSchema, TemplateId } from "@/src/types/template";
import { BackgroundImagePicker } from "@/src/studio/BackgroundImagePicker";
import { THEME_PRESETS } from "@/src/types/theme";

const currentYear = new Date().getFullYear();

function DebouncedInput({
  id,
  placeholder,
  value: externalValue,
  onChange,
}: {
  id: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(externalValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(externalValue);
  }, [externalValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onChange(newValue), 400);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <input
      id={id}
      type="text"
      className="field-input"
      placeholder={placeholder}
      value={localValue}
      onChange={handleChange}
    />
  );
}

function FieldWrapper({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function ThemePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="block text-xs font-medium text-muted">Theme</span>
      <div className="flex flex-col gap-2">
        {THEME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.id)}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-xs transition-all ${
              value === preset.id
                ? "border-accent bg-accent/10 text-text"
                : "border-border bg-surface-2 text-muted hover:border-accent/40"
            }`}
          >
            <span className="font-medium">{preset.label}</span>
            <div className="ml-auto flex gap-1">
              {preset.gridLevels.map((color, i) => (
                <div
                  key={i}
                  className="h-4 w-4 rounded-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SizePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (size: string) => void;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <span className="block text-xs font-medium text-muted">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(BANNER_SIZES).map(([key, size]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-3 text-xs transition-all ${
              value === key
                ? "border-accent bg-accent/10 text-text"
                : "border-border bg-surface-2 text-muted hover:border-accent/40"
            }`}
          >
            <span className="text-lg">{size.icon === "linkedin" ? "in" : "𝕏"}</span>
            <span className="font-medium">{size.label}</span>
            <span className="text-[10px] opacity-60">{size.width}×{size.height}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ControlSidebar({
  schema,
  state,
  templateId,
  accountCreatedYear,
  onChange,
}: {
  schema: EditorFieldSchema[];
  state: Record<string, unknown>;
  templateId: TemplateId;
  accountCreatedYear?: number | null;
  onChange: (key: string, value: unknown) => void;
}) {
  const mode = state.mode as string | undefined;

  const startYear = accountCreatedYear ?? currentYear - 9;
  const years = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => String(currentYear - i),
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-text">Customize</h3>
        <p className="text-xs text-muted">Adjust settings to personalize your banner.</p>
      </div>

      {schema.map((field) => {
        if (field.key === "username") return null;

        if (field.key === "selectedRepos" && templateId === "repos-banner" && mode === "pinned") {
          return null;
        }

        if (field.type === "sizeSelect") {
          return (
            <SizePicker
              key={field.key}
              label={field.label}
              value={String(state[field.key] ?? "")}
              onChange={(v) => onChange(field.key, v)}
            />
          );
        }

        if (field.key === "themeId") {
          return (
            <ThemePicker
              key={field.key}
              value={String(state[field.key] ?? "")}
              onChange={(v) => onChange(field.key, v)}
            />
          );
        }

        if (field.key === "year") {
          const contributionTemplates = templateId === "github-banner" || templateId === "contribution-banner";
          const yearOptions = contributionTemplates
            ? [{ value: "latest", label: "Last 365 days" }, ...years.map((y) => ({ value: y, label: y }))]
            : years.map((y) => ({ value: y, label: y }));
          return (
            <FieldWrapper key={field.key} label={field.label} htmlFor={field.key}>
              <select
                id={field.key}
                className="field-input"
                value={String(state[field.key] ?? currentYear)}
                onChange={(e) => onChange(field.key, e.target.value)}
              >
                {yearOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FieldWrapper>
          );
        }

        if (field.type === "toggle") {
          const checked = Boolean(state[field.key] ?? false);
          return (
            <div key={field.key} className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted">{field.label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(field.key, !checked)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  checked ? "bg-accent" : "bg-surface-2"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    checked ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        }

        if (field.type === "range") {
          const val = Number(state[field.key] ?? field.min ?? 1);
          return (
            <FieldWrapper key={field.key} label={`${field.label}: ${val}`} htmlFor={field.key}>
              <input
                id={field.key}
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={val}
                onChange={(e) => onChange(field.key, Number(e.target.value))}
                className="w-full accent-accent"
              />
            </FieldWrapper>
          );
        }

        if (field.type === "select") {
          return (
            <FieldWrapper key={field.key} label={field.label} htmlFor={field.key}>
              <select
                id={field.key}
                className="field-input"
                value={String(state[field.key] ?? "")}
                onChange={(e) => onChange(field.key, e.target.value)}
              >
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FieldWrapper>
          );
        }

        if (field.type === "textarea") {
          return (
            <FieldWrapper key={field.key} label={field.label} htmlFor={field.key}>
              <textarea
                id={field.key}
                rows={4}
                className="field-input resize-y"
                value={String(state[field.key] ?? "")}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            </FieldWrapper>
          );
        }

        if (field.type === "backgroundPicker") {
          return (
            <BackgroundImagePicker
              key={field.key}
              id={field.key}
              label={field.label}
              value={typeof state[field.key] === "string" ? (state[field.key] as string) : undefined}
              onChange={(next) => onChange(field.key, next)}
            />
          );
        }

        return (
          <FieldWrapper key={field.key} label={field.label} htmlFor={field.key}>
            <DebouncedInput
              id={field.key}
              placeholder={field.placeholder}
              value={String(state[field.key] ?? "")}
              onChange={(v) => onChange(field.key, v)}
            />
          </FieldWrapper>
        );
      })}
    </div>
  );
}
