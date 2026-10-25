import Link from "next/link";
import type { ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { HoverHighlightGroup, HoverHighlightItem } from "@/src/ui/HoverHighlight";
import { highlightItemClass } from "@/src/ui/highlightClasses";
import { ThemedIcon } from "@/src/theme/ThemedBrand";
import { TemplateSwitcher } from "@/src/studio/TemplateSwitcher";
import { templateRegistry } from "@/src/templates/registry";
import type { TemplateId } from "@/src/types/template";

/**
 * The studio header: the same at every width except the Download label, shown from sm. The
 * username and light/dark are in the sidebar (Profile and Style).
 */
export function TopBar({
  templateId,
  sidebarExpanded,
  onToggleSidebar,
  children,
}: {
  templateId: TemplateId;
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
  /** The export controls, on the right. */
  children: ReactNode;
}) {
  const SidebarIcon = sidebarExpanded ? PanelLeftClose : PanelLeftOpen;
  return (
    <>
      {/* Same rounded buttons and sliding hover/focus highlight as the site header. */}
      <HoverHighlightGroup
        layoutId="studio-left-highlight"
        className="flex min-w-0 items-center gap-1"
      >
        <HoverHighlightItem id="sidebar">
          <button
            type="button"
            className={highlightItemClass}
            onClick={onToggleSidebar}
            aria-expanded={sidebarExpanded}
            aria-controls="studio-sidebar"
            aria-label={sidebarExpanded ? "Hide settings" : "Show settings"}
          >
            <SidebarIcon className="h-[18px] w-[18px]" />
          </button>
        </HoverHighlightItem>
        {/* The app icon is the way home. */}
        <HoverHighlightItem id="home">
          <Link href="/" className={highlightItemClass} aria-label="Back to home">
            <ThemedIcon className="h-[22px] w-[22px] shrink-0" size={22} />
          </Link>
        </HoverHighlightItem>
        {/* The visible title is the template picker, so the h1 is a hidden copy. */}
        <h1 className="sr-only">{templateRegistry[templateId].meta.title}</h1>
        {/* What gives way on the narrowest phones: the template name truncates. */}
        <HoverHighlightItem id="template" shrink>
          <TemplateSwitcher templateId={templateId} />
        </HoverHighlightItem>
      </HoverHighlightGroup>
      {children}
    </>
  );
}
