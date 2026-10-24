import Link from "next/link";
import type { ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen, User } from "lucide-react";
import { HoverHighlightGroup, HoverHighlightItem } from "@/src/ui/HoverHighlight";
import { highlightItemBaseClass, highlightItemClass } from "@/src/ui/highlightClasses";
import { ThemedIcon } from "@/src/theme/ThemedBrand";
import { TemplateSwitcher } from "@/src/studio/TemplateSwitcher";
import type { TemplateId } from "@/src/types/template";

/**
 * The studio header. Its one change is at sm, where the profile and Download labels show; nothing
 * before them moves, as its height and padding are the same at every width (studio.module.css).
 * Light and dark are in the sidebar's Style settings.
 */
export function TopBar({
  title,
  templateId,
  username,
  needsUsername,
  onChangeUsername,
  sidebarExpanded,
  onToggleSidebar,
  children,
}: {
  title: string;
  templateId: TemplateId;
  username: string;
  needsUsername: boolean;
  onChangeUsername: () => void;
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
        <h1 className="sr-only">{title}</h1>
        {/* What gives way on the narrowest phones: the template name truncates. */}
        <HoverHighlightItem id="template" shrink>
          <TemplateSwitcher templateId={templateId} />
        </HoverHighlightItem>
        {needsUsername && username && (
          <HoverHighlightItem id="profile">
            <button
              type="button"
              onClick={onChangeUsername}
              aria-label={`Change GitHub username (@${username})`}
              className={`${highlightItemClass} sm:w-auto sm:px-[9px]`}
            >
              <User className="h-[18px] w-[18px] shrink-0" />
              <span className="hidden max-w-[10rem] truncate sm:inline">@{username}</span>
            </button>
          </HoverHighlightItem>
        )}
        {needsUsername && !username && (
          <HoverHighlightItem id="profile">
            {/* Accent color: choosing a username is the next step. */}
            <button
              type="button"
              onClick={onChangeUsername}
              aria-label="Choose GitHub username"
              className={`${highlightItemBaseClass} whitespace-nowrap text-accent hover:text-accent-hover sm:w-auto sm:px-[9px]`}
            >
              <User className="h-[18px] w-[18px] shrink-0" />
              <span className="hidden sm:inline">Choose username</span>
            </button>
          </HoverHighlightItem>
        )}
      </HoverHighlightGroup>
      <div className="flex shrink-0 items-center">{children}</div>
    </>
  );
}
