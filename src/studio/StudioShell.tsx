"use client";

import { useCallback, useMemo, useState } from "react";
import { templateRegistry } from "@/src/templates/registry";
import type { BannerSize, TemplateId } from "@/src/types/template";
import { ControlSidebar } from "@/src/studio/ControlSidebar";
import { PreviewArtboard } from "@/src/studio/PreviewArtboard";
import { computePreviewContentState } from "@/src/studio/preview/computePreviewContentState";
import type { PreviewContentState } from "@/src/studio/preview/types";
import { isExportBlocked } from "@/src/studio/exportBlocked";
import { Toast, useToast } from "@/src/ui/Toast";
import { useBannerImage } from "@/src/studio/preview/useBannerImage";
import { logoPositionFromState } from "@/src/banner/logo";
import type { Position } from "@/src/banner/position";
import { useHoldDuringLoad } from "@/src/studio/preview/useHoldDuringLoad";
import { useKeepWhile } from "@/src/studio/preview/useKeepWhile";
import { backgroundFromState, type BackgroundPosition } from "@/src/banner/background";
import { contentPositionFromState } from "@/src/banner/contentPosition";
import {
  FORMAT_COOKIE_NAME,
  parseFormatCookie,
  parsePixelRatioCookie,
  parsePreviewViewCookie,
  PIXEL_RATIO_COOKIE_NAME,
  PREVIEW_VIEW_COOKIE_NAME,
} from "@/src/studio/studioCookies";
import { TopBar } from "@/src/studio/TopBar";
import { ExportControls } from "@/src/studio/ExportControls";
import { useBannerExport } from "@/src/studio/useBannerExport";
import { UsernameModal } from "@/src/studio/UsernameModal";
import { useTheme } from "@/src/theme/ThemeProvider";
import type { ExportPixelRatio, ExportFormat } from "@/src/export/format";
import { useCookieChoice } from "@/src/studio/useCookieChoice";
import type { LinkSettings } from "@/src/studio/linkSettings";
import { BANNER_SIZES, type BannerView } from "@/src/lib/sizes";
import styles from "@/src/studio/studio.module.css";
import { useBannerSettings } from "@/src/studio/useBannerSettings";
import { useGithubBannerData } from "@/src/studio/useGithubBannerData";
import { useStudioSidebar } from "@/src/studio/useStudioSidebar";

/** Loads quicker than this go straight to the new preview, without showing the loading screen. */
const LOADING_SCREEN_DELAY_MS = 300;
/** Once shown, the loading screen stays at least this long, so it doesn't just blink. */
const LOADING_SCREEN_MIN_MS = 400;

/** Only a finished preview is held during a load; an empty or error state goes straight to it. */
function isReadyPreview(preview: { previewState: PreviewContentState }): boolean {
  return preview.previewState === "ready";
}

export function StudioShell({
  templateId,
  initialSidebarCollapsed,
  initialPixelRatio,
  initialFormat,
  initialPreviewView,
  savedSettings,
  savedUsername,
  link,
  initialGithubData,
}: {
  templateId: TemplateId;
  initialSidebarCollapsed: boolean;
  /** Download resolution from its cookie (3× when none is saved). */
  initialPixelRatio: ExportPixelRatio;
  /** Download format from its cookie (PNG when none is saved). */
  initialFormat: ExportFormat;
  /** The preview's view of a format that devices crop, from its cookie (phone when none). */
  initialPreviewView: BannerView;
  /** This template's settings from its cookie (null: none saved yet). */
  savedSettings: Record<string, unknown> | null;
  /** The GitHub username from its cookie (null: none saved yet). */
  savedUsername: string | null;
  /** Settings from a studio link (`?username=…&themeId=…`), applied over the saved ones. */
  link: LinkSettings | null;
  /** GitHub data the server already loaded, by the url the studio fetches it from. */
  initialGithubData: Record<string, unknown>;
}) {
  const { theme: appTheme } = useTheme();
  const definition = templateRegistry[templateId];
  const needsUsername = definition.meta.needsUsername;
  const { state, username, updateState, moveContent, missingSavedUsername } = useBannerSettings({
    templateId,
    savedSettings,
    savedUsername,
    link,
  });
  const github = useGithubBannerData({ templateId, state, username, initialGithubData });
  const sidebar = useStudioSidebar(initialSidebarCollapsed);
  const { toast, showError, showSuccess, dismissToast } = useToast();

  // Download resolution and format, remembered per browser.
  const [pixelRatio, changePixelRatio] = useCookieChoice(
    PIXEL_RATIO_COOKIE_NAME,
    parsePixelRatioCookie,
    initialPixelRatio,
  );
  const [format, changeFormat] = useCookieChoice(
    FORMAT_COOKIE_NAME,
    parseFormatCookie,
    initialFormat,
  );
  const [previewView, changePreviewView] = useCookieChoice(
    PREVIEW_VIEW_COOKIE_NAME,
    parsePreviewViewCookie,
    initialPreviewView,
  );

  // GitHub banners ask for a username right away when none is saved or linked.
  const [showUsernameModal, setShowUsernameModal] = useState(missingSavedUsername);
  const openUsernameModal = useCallback(() => setShowUsernameModal(true), []);
  const closeUsernameModal = useCallback(() => setShowUsernameModal(false), []);
  function handleUsernameSubmit(newUsername: string) {
    updateState("username", newUsername);
    closeUsernameModal();
  }

  const size = (state.size as BannerSize) ?? definition.meta.defaultSize;
  const fill = state.contentSize === "fill";
  // A profile photo that failed to load can't be shown, Fill covers the whole banner, and without
  // quote marks there's nothing to color.
  const noMarks = state.quoteMarks === "none";
  const disabledFields = useMemo(() => {
    const keys = new Set<string>();
    if (github.avatarFailed) keys.add("showAvatar");
    if (fill) keys.add("alignment");
    if (noMarks) keys.add("markColor");
    return keys;
  }, [github.avatarFailed, fill, noMarks]);

  // A required field such as the quote is empty (the username is handled on its own).
  const missingContent = definition.schema.some(
    (field) => field.required && field.key !== "username" && !String(state[field.key] ?? "").trim(),
  );
  const previewState = computePreviewContentState({
    needsUsername,
    username,
    missingContent,
    dataError: github.problem?.title ?? null,
    dataReady: github.dataReady,
  });

  const stateValid = useMemo(
    () => definition.stateSchema.safeParse(state).success,
    [definition.stateSchema, state],
  );
  const background = backgroundFromState(state);
  const moveBackground = useCallback(
    (position: BackgroundPosition) => updateState("backgroundPosition", position),
    [updateState],
  );
  const backgroundImage = useBannerImage(state.backgroundImage, "background", showError);
  /** The background that can be moved and zoomed: one that's chosen and shows in the preview. */
  const adjustableBackground = backgroundImage.usableSrc ? background : undefined;
  const logoImage = useBannerImage(state.logoImage, "logo", showError);
  const moveLogo = useCallback(
    (position: Position) => updateState("logoPosition", position),
    [updateState],
  );

  const backgroundFields = useMemo(
    () => ({
      backgroundImage: backgroundImage.usableSrc,
      backgroundPosition: state.backgroundPosition,
      backgroundZoom: state.backgroundZoom,
    }),
    [backgroundImage.usableSrc, state.backgroundPosition, state.backgroundZoom],
  );
  // A new background replaces the old one once it has loaded, instead of leaving the banner
  // without one in between.
  const shownBackground = useKeepWhile(backgroundFields, backgroundImage.status === "loading");
  const previewBannerState = useMemo(
    () => ({ ...state, ...shownBackground, logoImage: logoImage.usableSrc }),
    [state, shownBackground, logoImage.usableSrc],
  );
  // What the preview and the Download button show. A quick load keeps the previous preview
  // instead of flashing the loading screen (see useHoldDuringLoad); both always change together.
  const livePreview = useMemo(
    () => ({
      previewState,
      problem: github.problem,
      bannerState: previewBannerState,
      data: github.data,
    }),
    [previewState, github.problem, previewBannerState, github.data],
  );
  const shownPreview = useHoldDuringLoad(livePreview, previewState === "loading", {
    delayMs: LOADING_SCREEN_DELAY_MS,
    minShowMs: LOADING_SCREEN_MIN_MS,
    canHold: isReadyPreview,
  });
  const exportBlocked = isExportBlocked({
    previewState: shownPreview.previewState,
    stateValid,
    imageUnusable: backgroundImage.status === "failed" || logoImage.status === "failed",
    previewPending:
      shownPreview !== livePreview ||
      github.contributionsStale ||
      shownBackground !== backgroundFields ||
      logoImage.status === "loading",
  });

  const bannerExport = useBannerExport({
    request: { templateId, size, state, pixelRatio, uiTheme: appTheme },
    format,
    blocked: exportBlocked,
    showError,
    showSuccess,
    dismissToast,
  });

  return (
    <div className={styles.shell}>
      <Toast toast={toast} onDismiss={dismissToast} />
      <UsernameModal
        open={showUsernameModal}
        currentUsername={username}
        onSubmit={handleUsernameSubmit}
        onCancel={closeUsernameModal}
      />

      {/* Unreachable while the username dialog is open. */}
      <header className={styles.topbar} inert={showUsernameModal}>
        <TopBar
          templateId={templateId}
          sidebarExpanded={sidebar.sidebarExpanded}
          onToggleSidebar={sidebar.toggleSidebar}
        >
          <ExportControls
            onDownload={bannerExport.download}
            onCopy={bannerExport.copy}
            exporting={bannerExport.exporting}
            exportBlocked={exportBlocked}
            pixelRatio={pixelRatio}
            onPixelRatioChange={changePixelRatio}
            format={format}
            onFormatChange={changeFormat}
            bannerFormat={BANNER_SIZES[size]}
          />
        </TopBar>
      </header>
      <div
        className={styles.content}
        data-sidebar-collapsed={sidebar.sidebarCollapsed}
        data-sidebar-open={sidebar.drawerOpen}
        data-sidebar-animating={sidebar.sidebarAnimating}
        inert={showUsernameModal}
      >
        <aside id="studio-sidebar" className={styles.sidebar} aria-label="Banner settings">
          <div className={styles.sidebarInner}>
            <ControlSidebar
              profile={
                needsUsername ? { username, onChangeUsername: openUsernameModal } : undefined
              }
              schema={definition.schema}
              state={state}
              accountCreatedYear={github.accountCreatedYear}
              onChange={updateState}
              repoCatalog={github.repoCatalog}
              disabledFields={disabledFields}
              adjustableBackground={adjustableBackground}
              onError={showError}
              onErrorResolved={dismissToast}
            />
          </div>
        </aside>
        <button
          type="button"
          className={styles.backdrop}
          onClick={sidebar.closeDrawer}
          aria-label="Close settings"
          tabIndex={-1}
        />
        {/* Covered by the phone drawer. */}
        <main className={styles.preview} inert={sidebar.isPhone && sidebar.drawerOpen}>
          <PreviewArtboard
            templateId={templateId}
            size={size}
            view={previewView}
            onViewChange={changePreviewView}
            state={shownPreview.bannerState}
            data={shownPreview.data}
            previewState={shownPreview.previewState}
            problem={shownPreview.problem}
            onRetry={github.retry}
            onChangeUsername={openUsernameModal}
            onEditSetting={sidebar.focusSetting}
            backgroundAdjust={
              adjustableBackground
                ? {
                    position: adjustableBackground.position,
                    zoom: adjustableBackground.zoom,
                    onMove: moveBackground,
                  }
                : undefined
            }
            contentAdjust={
              fill ? undefined : { position: contentPositionFromState(state), onMove: moveContent }
            }
            logoAdjust={
              logoImage.usableSrc
                ? { position: logoPositionFromState(state), onMove: moveLogo }
                : undefined
            }
          />
        </main>
      </div>
    </div>
  );
}
