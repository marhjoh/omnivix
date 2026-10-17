import Link from "next/link";
import type { ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen, User } from "lucide-react";
import { ThemeToggle } from "@/src/theme/ThemeToggle";
import { HoverHighlightGroup, HoverHighlightItem } from "@/src/ui/HoverHighlight";
import { highlightItemBaseClass, highlightItemClass } from "@/src/ui/highlightClasses";
import { ThemedIcon } from "@/src/theme/ThemedBrand";

export function TopBar({
  title,
  username,
  needsUsername,
  onChangeUsername,
  sidebarExpanded,
  onToggleSidebar,
  children,
}: {
  title: string;
  username: string;
  needsUsername: boolean;
  onChangeUsername: () => void;
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
  /** The export buttons, at the end of the right group (HoverHighlightItems). */
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
        {/*
          What gives way as the header narrows: first the title (shown from md, truncates there),
          then the profile pill's text (round icon button below sm). The app icon always stays,
          and the @username never truncates except when very long.
        */}
        <div className="flex shrink-0 items-center gap-2.5 md:min-w-0 md:shrink">
          {/* The app icon is the way home. */}
          <HoverHighlightItem id="home">
            <Link href="/" className={highlightItemClass} aria-label="Back to home">
              <ThemedIcon className="h-[22px] w-[22px] shrink-0" size={22} />
            </Link>
          </HoverHighlightItem>
          {/* The visible title below only shows from md, so the h1 is a hidden copy. */}
          <h1 className="sr-only">{title}</h1>
          <span className="hidden truncate font-medium md:inline" aria-hidden>
            {title}
          </span>
        </div>
        {needsUsername && username && (
          <HoverHighlightItem id="profile" className="md:ml-2">
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
          <HoverHighlightItem id="profile" className="md:ml-2">
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
      <HoverHighlightGroup
        layoutId="studio-right-highlight"
        className="flex shrink-0 items-center gap-1"
      >
        <HoverHighlightItem id="theme">
          <ThemeToggle className={highlightItemClass} />
        </HoverHighlightItem>
        {children}
      </HoverHighlightGroup>
    </>
  );
}
