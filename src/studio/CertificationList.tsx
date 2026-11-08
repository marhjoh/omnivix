"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { ArrowDown, ArrowUp, Award, Plus, X } from "lucide-react";
import { brandIconColor } from "@/src/banner/iconColor";
import {
  CERTIFICATION_NAME_MAX_LENGTH,
  certificationIcons,
  cleanCertificationText,
  cleanYear,
  encodeCertifications,
  ISSUER_MAX_LENGTH,
  MAX_CERTIFICATIONS,
  parseCertifications,
  type Certification,
} from "@/src/banner/certifications";
import { IconMark } from "@/src/icons/IconMark";
import { IconOption } from "@/src/studio/IconPicker";
import { ICON_CATALOG_URL, type IconCatalogEntry, type TechIcon } from "@/src/icons/iconSelection";
import { searchIcons } from "@/src/icons/searchIcons";
import { useApiQuery } from "@/src/studio/useApiQuery";
import { useIcons } from "@/src/studio/useIcons";
import { useTheme } from "@/src/theme/ThemeProvider";
import type { Theme } from "@/src/theme/theme";
import { FieldLabel, fieldLabelId, FieldValue } from "@/src/ui/FieldLabel";

const EMPTY: Certification = { name: "", issuer: "", year: "", slug: "" };

const ROW_BUTTON =
  "rounded-md p-1 text-muted transition-colors duration-(--hover-fade) enabled:hover:bg-surface-2 enabled:hover:text-text disabled:cursor-not-allowed disabled:text-(--disabled-text)";

type Direction = "up" | "down";

/** Runs after the list re-renders, like `focusSetting` in useStudioSidebar.ts. */
function focusLater(id: string) {
  requestAnimationFrame(() => document.getElementById(id)?.focus());
}

/**
 * Edits the certifications banner's list: a row per certification with its name, issuer and year.
 * The issuer field suggests Simple Icons, whose icon the badge then shows.
 */
export function CertificationList({
  id,
  label,
  value,
  onChange,
}: {
  /** The Add button's id, so the preview's "Add certifications" can focus it. */
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { theme } = useTheme();
  const certifications = parseCertifications(value);
  const full = certifications.length >= MAX_CERTIFICATIONS;
  const { data: icons } = useIcons(certificationIcons(value));
  // The row the Add button made, so its name field gets focus when it mounts.
  const [addedRow, setAddedRow] = useState<number | null>(null);

  const last = certifications.length - 1;
  const moveId = (index: number, direction: Direction) => `${id}-${index}-${direction}`;

  const save = (next: Certification[]) => onChange(encodeCertifications(next));
  const update = (index: number, change: Partial<Certification>) =>
    save(certifications.map((c, i) => (i === index ? { ...c, ...change } : c)));
  // Rows are keyed by position, so focus would stay behind on the row that took this one's place.
  // It follows the moved row instead, to the other button once that row reaches an end.
  const move = (index: number, direction: Direction) => {
    const to = direction === "up" ? index - 1 : index + 1;
    const next = [...certifications];
    [next[index], next[to]] = [next[to], next[index]];
    save(next);
    const atEnd = direction === "up" ? to === 0 : to === last;
    focusLater(moveId(to, atEnd ? (direction === "up" ? "down" : "up") : direction));
  };
  const remove = (index: number) => {
    save(certifications.filter((_, i) => i !== index));
    // The last row's buttons go away with it.
    if (index === last) focusLater(id);
  };

  return (
    <div className="space-y-1.5">
      <FieldLabel
        id={fieldLabelId(id)}
        end={
          <FieldValue>
            {certifications.length}/{MAX_CERTIFICATIONS}
          </FieldValue>
        }
      >
        {label}
      </FieldLabel>
      {certifications.length > 0 && (
        <ol aria-labelledby={fieldLabelId(id)} className="space-y-2">
          {certifications.map((certification, i) => (
            <CertificationRow
              key={i}
              number={i + 1}
              certification={certification}
              icons={icons}
              theme={theme}
              autoFocus={i === addedRow}
              moveIds={{ up: moveId(i, "up"), down: moveId(i, "down") }}
              first={i === 0}
              last={i === last}
              onChange={(change) => update(i, change)}
              onMove={(direction) => move(i, direction)}
              onRemove={() => remove(i)}
            />
          ))}
        </ol>
      )}
      <button
        id={id}
        type="button"
        disabled={full}
        onClick={() => {
          setAddedRow(certifications.length);
          save([...certifications, EMPTY]);
        }}
        className="btn-secondary h-9 w-full justify-center px-3 py-0"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Add certification
      </button>
    </div>
  );
}

function CertificationRow({
  number,
  certification,
  icons,
  theme,
  autoFocus,
  moveIds,
  first,
  last,
  onChange,
  onMove,
  onRemove,
}: {
  number: number;
  certification: Certification;
  /** Loaded issuer icons. */
  icons: TechIcon[] | undefined;
  theme: Theme;
  autoFocus: boolean;
  /** The Move buttons' ids, so focus can follow a moved row. */
  moveIds: Record<Direction, string>;
  first: boolean;
  last: boolean;
  onChange: (change: Partial<Certification>) => void;
  onMove: (direction: Direction) => void;
  onRemove: () => void;
}) {
  const name = certification.name.trim() || `Certification ${number}`;
  const icon = icons?.find((loaded) => loaded.slug === certification.slug);
  return (
    <li className="space-y-1.5 rounded-lg border border-(--control-border) bg-surface p-2">
      <div className="flex items-center gap-1">
        <input
          type="text"
          aria-label={`Certification ${number} name`}
          placeholder="Name, e.g. Solutions Architect"
          maxLength={CERTIFICATION_NAME_MAX_LENGTH}
          autoFocus={autoFocus}
          className="field-input min-w-0 flex-1"
          value={certification.name}
          onChange={(e) => onChange({ name: cleanCertificationText(e.target.value) })}
        />
        <button
          id={moveIds.up}
          type="button"
          aria-label={`Move ${name} up`}
          disabled={first}
          onClick={() => onMove("up")}
          className={ROW_BUTTON}
        >
          <ArrowUp className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          id={moveIds.down}
          type="button"
          aria-label={`Move ${name} down`}
          disabled={last}
          onClick={() => onMove("down")}
          className={ROW_BUTTON}
        >
          <ArrowDown className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          aria-label={`Remove ${name}`}
          onClick={onRemove}
          className={ROW_BUTTON}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <div className="flex gap-1.5">
        <IssuerField
          number={number}
          certification={certification}
          icon={icon}
          theme={theme}
          onChange={onChange}
        />
        <input
          type="text"
          inputMode="numeric"
          aria-label={`Certification ${number} year`}
          placeholder="Year"
          maxLength={4}
          className="field-input w-[4.5rem] shrink-0 tabular-nums"
          value={certification.year}
          onChange={(e) => onChange({ year: cleanYear(e.target.value) })}
        />
      </div>
    </li>
  );
}

/**
 * The issuer, typed or picked from Simple Icons. Picking a suggestion, or leaving the field with a
 * name Simple Icons has, sets its icon. Any other name gets the award icon.
 */
function IssuerField({
  number,
  certification,
  icon,
  theme,
  onChange,
}: {
  number: number;
  certification: Certification;
  icon: TechIcon | undefined;
  theme: Theme;
  onChange: (change: Partial<Certification>) => void;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [catalogWanted, setCatalogWanted] = useState(false);
  const catalog = useApiQuery<IconCatalogEntry[]>(catalogWanted ? ICON_CATALOG_URL : null);
  const query = certification.issuer;
  const results = catalog.data ? searchIcons(catalog.data, query) : [];
  // Nothing to suggest once the issuer is a picked icon.
  const picked = results.some(
    (entry) => entry.slug === certification.slug && entry.title === query,
  );
  const shown = open && results.length > 0 && !picked;
  const activeIcon = shown ? results[active] : undefined;
  const optionId = (slug: string) => `${listId}-${slug}`;

  const pick = (entry: IconCatalogEntry) => {
    onChange({ issuer: entry.title.slice(0, ISSUER_MAX_LENGTH), slug: entry.slug });
    setOpen(false);
  };
  const type = (text: string) => {
    onChange({ issuer: cleanCertificationText(text), slug: "" });
    setActive(0);
    setOpen(true);
  };
  // A name typed in full gets its icon too, but only on leaving the field. While typing, "Red" on
  // the way to "Red Hat" would show another brand's icon.
  const leave = () => {
    setOpen(false);
    if (certification.slug) return;
    const issuer = certification.issuer.trim().toLowerCase();
    const match = catalog.data?.find((entry) => entry.title.toLowerCase() === issuer);
    if (match) onChange({ slug: match.slug });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const step = (by: number) => {
      e.preventDefault();
      setOpen(true);
      if (results.length) setActive((active + by + results.length) % results.length);
    };
    if (e.key === "ArrowDown") step(1);
    else if (e.key === "ArrowUp") step(-1);
    else if (e.key === "Enter" && activeIcon) {
      e.preventDefault();
      pick(activeIcon);
    } else if (e.key === "Escape" && shown) {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="relative min-w-0 flex-1">
      <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted">
        {icon ? (
          <IconMark
            icon={icon}
            size={14}
            color={brandIconColor(icon.hex, theme) ?? "currentColor"}
          />
        ) : (
          <Award className="h-3.5 w-3.5" aria-hidden />
        )}
      </span>
      <input
        type="text"
        role="combobox"
        aria-label={`Certification ${number} issuer`}
        aria-expanded={shown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeIcon ? optionId(activeIcon.slug) : undefined}
        autoComplete="off"
        spellCheck={false}
        placeholder="Issuer, e.g. AWS"
        maxLength={ISSUER_MAX_LENGTH}
        className={`field-input pl-8 ${shown ? "rounded-b-none" : ""}`}
        value={query}
        onFocus={() => {
          setCatalogWanted(true);
          setOpen(true);
        }}
        onBlur={leave}
        onChange={(e) => type(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {shown && (
        <div
          id={listId}
          role="listbox"
          aria-label={`Certification ${number} issuer suggestions`}
          className="popover popover-attached max-h-60 overflow-y-auto p-1"
        >
          {results.map((entry, i) => (
            <IconOption
              key={entry.slug}
              id={optionId(entry.slug)}
              icon={entry}
              picked={entry.slug === certification.slug}
              disabled={false}
              active={i === active}
              theme={theme}
              onPoint={() => setActive(i)}
              onToggle={() => pick(entry)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
