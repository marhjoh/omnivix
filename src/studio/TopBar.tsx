import Link from "next/link";
import { useId } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  User,
} from "lucide-react";
import { EXPORT_PIXEL_RATIOS, type ExportPixelRatio } from "@/src/export/viewport";
import {
  DropdownGroupLabel,
  DropdownList,
  DropdownOption,
  DropdownRoot,
  useDropdown,
} from "@/src/ui/Dropdown";
import { ThemeToggle } from "@/src/theme/ThemeToggle";
import { HoverHighlightGroup, HoverHighlightItem } from "@/src/ui/HoverHighlight";
import { highlightItemBaseClass, highlightItemClass } from "@/src/ui/highlightClasses";
import { ThemedIcon } from "@/src/theme/ThemedBrand";

export function TopBar({
  title,
  onDownload,
  isDownloading,
  exportBlocked,
  username,
  needsUsername,
  onChangeUsername,
  sidebarExpanded,
  onToggleSidebar,
  pixelRatio,
  onPixelRatioChange,
  bannerSize,
}: {
  title: string;
  onDownload: () => void;
  isDownloading: boolean;
  /** Nothing to export yet (or a problem with it); the button is disabled. */
  exportBlocked: boolean;
  username: string;
  needsUsername: boolean;
  onChangeUsername: () => void;
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
  pixelRatio: ExportPixelRatio;
  onPixelRatioChange: (ratio: ExportPixelRatio) => void;
  /** The chosen format's size at 1×, for the pixel sizes in the resolution menu. */
  bannerSize: { width: number; height: number };
}) {
  const SidebarIcon = sidebarExpanded ? PanelLeftClose : PanelLeftOpen;
  const resolutionMenu = useDropdown(useId());
  const MenuChevron = resolutionMenu.open ? ChevronUp : ChevronDown;
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
        {/*
          36px tall and round like the other header controls; icon-only on phones (aria-label keeps
          the name). The chevron half opens the resolution menu.
        */}
        <DropdownRoot dropdown={resolutionMenu} className="relative flex shrink-0">
          <button
            className="btn-primary h-9 w-9 rounded-l-full rounded-r-none p-0 sm:w-auto sm:min-w-[10rem] sm:px-4"
            onClick={onDownload}
            disabled={isDownloading || exportBlocked}
            aria-label={isDownloading ? "Exporting…" : "Download PNG"}
            aria-busy={isDownloading}
            type="button"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Exporting&hellip;</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download PNG</span>
              </>
            )}
          </button>
          <button
            type="button"
            id={resolutionMenu.triggerId}
            className="btn-primary h-9 w-8 rounded-l-none rounded-r-full border-l-white/30 p-0"
            onClick={() => resolutionMenu.setOpen((open) => !open)}
            disabled={isDownloading}
            aria-haspopup="listbox"
            aria-expanded={resolutionMenu.open}
            aria-controls={resolutionMenu.open ? resolutionMenu.listId : undefined}
            aria-label={`Download resolution: ${pixelRatio}×`}
          >
            <MenuChevron className="h-4 w-4" aria-hidden />
          </button>
          <DropdownList
            dropdown={resolutionMenu}
            label="Download resolution"
            className="right-0 w-max"
          >
            <DropdownGroupLabel>Resolution</DropdownGroupLabel>
            {EXPORT_PIXEL_RATIOS.map((ratio) => (
              <DropdownOption
                key={ratio}
                selected={ratio === pixelRatio}
                onSelect={() => {
                  onPixelRatioChange(ratio);
                  resolutionMenu.close();
                }}
              >
                {ratio}× · {bannerSize.width * ratio} × {bannerSize.height * ratio}
              </DropdownOption>
            ))}
          </DropdownList>
        </DropdownRoot>
      </HoverHighlightGroup>
    </>
  );
}
