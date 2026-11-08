"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { Check, X } from "lucide-react";
import { brandIconColor } from "@/src/banner/iconColor";
import { IconMark } from "@/src/icons/IconMark";
import {
  ICON_CATALOG_URL,
  MAX_ICONS,
  parseIconSelection,
  type IconCatalogEntry,
  type TechIcon,
} from "@/src/icons/iconSelection";
import { searchIcons } from "@/src/icons/searchIcons";
import { CheckList } from "@/src/studio/CheckList";
import controls from "@/src/studio/controls.module.css";
import { useApiQuery } from "@/src/studio/useApiQuery";
import { useIcons } from "@/src/studio/useIcons";
import { useTheme } from "@/src/theme/ThemeProvider";
import type { Theme } from "@/src/theme/theme";
import { FieldLabel, FieldValue } from "@/src/ui/FieldLabel";

const MESSAGE_CLASS = "px-2.5 py-[7px] text-sm";

/** Keeps focus in the search field when a result is clicked. */
const keepFocus = (e: { preventDefault: () => void }) => e.preventDefault();

/**
 * Picks Simple Icons by searching their names, for an `icons` setting. The search list loads the
 * first time the field gets focus, so it stays out of the studio's bundle.
 */
export function IconPicker({
  id,
  label,
  value,
  onChange,
}: {
  /** The search field's id, so the preview's "Add icons" can focus it. */
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const listId = useId();
  const { theme } = useTheme();
  const selected = parseIconSelection(value);
  const picked = new Set(selected);
  const full = selected.length >= MAX_ICONS;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [catalogWanted, setCatalogWanted] = useState(false);
  const catalog = useApiQuery<IconCatalogEntry[]>(catalogWanted ? ICON_CATALOG_URL : null);
  const results = catalog.data ? searchIcons(catalog.data, query) : [];
  const shown = open && query.trim() !== "";
  const activeIcon = shown ? results[active] : undefined;
  const { data: icons } = useIcons(value);

  const toggle = (slug: string) => {
    if (picked.has(slug)) onChange(selected.filter((s) => s !== slug).join(", "));
    else if (!full) onChange([...selected, slug].join(", "));
  };
  const optionId = (slug: string) => `${listId}-${slug}`;

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const move = (step: number) => {
      e.preventDefault();
      setOpen(true);
      if (results.length) setActive((active + step + results.length) % results.length);
    };
    if (e.key === "ArrowDown") move(1);
    else if (e.key === "ArrowUp") move(-1);
    else if (e.key === "Enter" && activeIcon) {
      e.preventDefault();
      toggle(activeIcon.slug);
    } else if (e.key === "Escape" && shown) {
      e.preventDefault();
      setQuery("");
    }
  };

  return (
    <div className="space-y-1.5">
      <FieldLabel
        htmlFor={id}
        // Picked out of the maximum, so it's clear why nothing more can be added.
        end={
          <FieldValue>
            {selected.length}/{MAX_ICONS}
          </FieldValue>
        }
      >
        {label}
      </FieldLabel>
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={shown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIcon ? optionId(activeIcon.slug) : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder="Search icons, e.g. React"
          className={`field-input ${shown ? "rounded-b-none" : ""}`}
          value={query}
          onFocus={() => {
            setCatalogWanted(true);
            setOpen(true);
          }}
          onBlur={() => setOpen(false)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        {shown && (
          <div
            id={listId}
            role="listbox"
            aria-label={`${label} results`}
            aria-multiselectable
            className="popover popover-attached max-h-72 overflow-y-auto p-1"
          >
            {catalog.data ? (
              results.length ? (
                results.map((icon, i) => (
                  <IconOption
                    key={icon.slug}
                    id={optionId(icon.slug)}
                    icon={icon}
                    picked={picked.has(icon.slug)}
                    disabled={full && !picked.has(icon.slug)}
                    active={i === active}
                    theme={theme}
                    onPoint={() => setActive(i)}
                    onToggle={() => toggle(icon.slug)}
                  />
                ))
              ) : (
                <p className={`${MESSAGE_CLASS} text-muted`}>No icons found.</p>
              )
            ) : catalog.error ? (
              <p className={`${MESSAGE_CLASS} text-danger`} role="alert">
                Couldn&apos;t load the icons.{" "}
                <button
                  type="button"
                  className="underline"
                  onMouseDown={keepFocus}
                  onClick={() => void catalog.refetch()}
                >
                  Try again
                </button>
              </p>
            ) : (
              <p className={`${MESSAGE_CLASS} text-muted`}>Loading icons…</p>
            )}
          </div>
        )}
      </div>
      <PickedIcons slugs={selected} icons={icons} theme={theme} onRemove={toggle} />
    </div>
  );
}

/** A search result. Picked ones show a check, the others their brand color. */
function IconOption({
  id,
  icon,
  picked,
  disabled,
  active,
  theme,
  onPoint,
  onToggle,
}: {
  id: string;
  icon: IconCatalogEntry;
  picked: boolean;
  /** Not picked, and the limit is reached. */
  disabled: boolean;
  /** The option the arrow keys are on. */
  active: boolean;
  theme: Theme;
  onPoint: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={picked}
      aria-disabled={disabled}
      onMouseDown={keepFocus}
      onMouseMove={onPoint}
      onClick={onToggle}
      className={`flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-[7px] text-sm font-medium text-text transition-colors duration-(--hover-fade) aria-disabled:cursor-not-allowed aria-disabled:text-(--disabled-text) ${active ? "bg-surface-2" : ""}`}
    >
      {picked ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-accent-hover" aria-hidden />
      ) : (
        <span
          aria-hidden
          className="mx-[3px] h-2 w-2 shrink-0 rounded-full"
          style={{ background: brandIconColor(icon.hex, theme) ?? "currentColor" }}
        />
      )}
      <span className="truncate">{icon.title}</span>
    </div>
  );
}

/** The picked icons in banner order, each with a Remove button. */
function PickedIcons({
  slugs,
  icons,
  theme,
  onRemove,
}: {
  slugs: string[];
  /** Loaded icons. Until they're in, a row shows its slug. */
  icons: TechIcon[] | undefined;
  theme: Theme;
  onRemove: (slug: string) => void;
}) {
  if (slugs.length === 0) return null;
  const bySlug = new Map(icons?.map((icon) => [icon.slug, icon]));
  return (
    <CheckList>
      {slugs.map((slug) => {
        const icon = bySlug.get(slug);
        const title = icon?.title ?? slug;
        return (
          <div key={slug} className={controls.listRow}>
            <span className="flex min-w-0 items-center gap-2">
              {icon ? (
                <IconMark
                  icon={icon}
                  size={16}
                  color={brandIconColor(icon.hex, theme) ?? "currentColor"}
                />
              ) : (
                <span className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">{title}</span>
            </span>
            <button
              type="button"
              aria-label={`Remove ${title}`}
              onClick={() => onRemove(slug)}
              className="-mr-1.5 rounded-md p-1 text-muted transition-colors duration-(--hover-fade) hover:bg-surface-2 hover:text-text"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        );
      })}
    </CheckList>
  );
}
