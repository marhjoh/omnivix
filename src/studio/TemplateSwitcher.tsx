"use client";

import { useId, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { getTemplates, templateRegistry } from "@/src/templates/registry";
import type { TemplateId } from "@/src/types/template";
import { DropdownList, DropdownOption, DropdownRoot, useDropdown } from "@/src/ui/Dropdown";

/** "GitHub Banner" → "GitHub": the header has room for the short names at every width. */
const shortTitle = (title: string) => title.replace(/ Banner$/, "");

/**
 * The studio header's title as a template picker, with the same list as the sidebar's dropdowns
 * and the header's sliding highlight (TopBar wraps it in a HoverHighlightItem).
 * Picking another template opens it in the studio; each template keeps its own saved settings
 * (one cookie per template). The button shows the short name, the list the full ones.
 */
export function TemplateSwitcher({ templateId }: { templateId: TemplateId }) {
  const router = useRouter();
  // The next template's page renders on the server; the spinner shows until it's there.
  const [switching, startSwitch] = useTransition();
  const dropdown = useDropdown(useId());
  const { open, setOpen, listId, triggerId } = dropdown;
  const templates = getTemplates();
  const { title } = templateRegistry[templateId].meta;
  return (
    <DropdownRoot dropdown={dropdown} className="min-w-0">
      <button
        type="button"
        id={triggerId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`Template: ${title}`}
        onClick={() => setOpen((o) => !o)}
        aria-busy={switching}
        className="relative z-10 flex h-9 max-w-full min-w-0 items-center gap-1 rounded-full px-2.5 text-sm font-semibold text-text focus-visible:ring-[3px] focus-visible:ring-accent/15 focus-visible:outline-1 focus-visible:outline-accent"
      >
        {/* Truncates on the narrowest phones instead of running under the buttons next to it. */}
        <span className="truncate">{shortTitle(title)}</span>
        {switching ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" aria-hidden />
        ) : (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        )}
      </button>
      <DropdownList dropdown={dropdown} label="Templates" floating>
        {templates.map(({ meta }) => (
          <DropdownOption
            key={meta.id}
            selected={meta.id === templateId}
            onSelect={() => {
              dropdown.close();
              if (meta.id !== templateId) startSwitch(() => router.push(`/studio/${meta.id}`));
            }}
          >
            <span className="whitespace-nowrap">{meta.title}</span>
          </DropdownOption>
        ))}
      </DropdownList>
    </DropdownRoot>
  );
}
