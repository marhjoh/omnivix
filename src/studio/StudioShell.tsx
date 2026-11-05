"use client";

import { useCallback, useMemo, useState } from "react";
import { templateRegistry } from "@/src/templates/registry";
import type { TemplateId } from "@/src/templates/types";
import { ControlSidebar } from "@/src/studio/ControlSidebar";
import { PreviewArtboard } from "@/src/studio/preview/PreviewArtboard";
import { computePreviewContentState } from "@/src/studio/preview/computePreviewContentState";
import { Toast, useToast } from "@/src/ui/Toast";
import { useBannerImage } from "@/src/studio/preview/useBannerImage";
import { logoPositionFromState } from "@/src/banner/logo";
import type { Position } from "@/src/banner/position";
import { useHoldDuringLoad } from "@/src/ui/useHoldDuringLoad";
import { useKeepWhile } from "@/src/ui/useKeepWhile";
import { backgroundFromState } from "@/src/banner/background";
import { contentPositionFromState } from "@/src/banner/contentPosition";
import { FORMAT_COOKIE, PIXEL_RATIO_COOKIE, PREVIEW_VIEW_COOKIE } from "@/src/studio/studioCookies";
import { TopBar } from "@/src/studio/TopBar";
import { ExportControls } from "@/src/studio/ExportControls";
import { useBannerExport } from "@/src/studio/useBannerExport";
import { UsernameModal } from "@/src/studio/UsernameModal";
import { useTheme } from "@/src/theme/ThemeProvider";
import type { ExportPixelRatio, ExportFormat } from "@/src/export/format";
import { useCookieChoice } from "@/src/studio/useCookieChoice";
import type { LinkSettings, StartingSettings } from "@/src/studio/linkSettings";
import { BANNER_SIZES, type BannerSize, type BannerView } from "@/src/lib/sizes";
import styles from "@/src/studio/studio.module.css";
import { useBannerSettings } from "@/src/studio/useBannerSettings";
import { useGithubBannerData } from "@/src/studio/useGithubBannerData";
import { useStudioSidebar } from "@/src/studio/useStudioSidebar";

export function StudioShell({
  templateId,
  initialSidebarCollapsed,
  initialPixelRatio,
  initialFormat,
  initialPreviewView,
  start,
  link,
  initialGithubData,
}: {
  templateId: TemplateId;
  initialSidebarCollapsed: boolean;
  /** Download resolution from its cookie (3× when none is saved). */
  initialPixelRatio: ExportPixelRatio;
  /** Download format from its cookie (PNG when none is saved). */
  initialFormat: ExportFormat;
  /** Which device crop the preview shows, from its cookie (phone when none is saved). */
  initialPreviewView: BannerView;
  /** The settings and username from their cookies, with the studio link applied. */
  start: StartingSettings;
  /** Settings from a studio link (`?username=…&themeId=…`), applied over the saved ones. */
  link: LinkSettings | null;
  /** GitHub data the server already loaded, keyed by URL. */
  initialGithubData: Record<string, unknown>;
}) {
  const { theme: appTheme } = useTheme();
  const definition = templateRegistry[templateId];
  const needsUsername = definition.meta.needsUsername;
  const { state, username, updateState, moveContent, missingSavedUsername } = useBannerSettings({
    templateId,
    start,
    link,
  });
  const github = useGithubBannerData({ templateId, state, username, initialGithubData });
  const sidebar = useStudioSidebar(initialSidebarCollapsed);
  const { toast, showError, showSuccess, dismissToast } = useToast();

  // Download resolution and format, remembered per browser.
  const [pixelRatio, changePixelRatio] = useCookieChoice(PIXEL_RATIO_COOKIE, initialPixelRatio);
  const [format, changeFormat] = useCookieChoice(FORMAT_COOKIE, initialFormat);
  const [previewView, changePreviewView] = useCookieChoice(PREVIEW_VIEW_COOKIE, initialPreviewView);

  // GitHub banners ask for a username right away when none is saved or linked.
  const [showUsernameModal, setShowUsernameModal] = useState(missingSavedUsername);
  const openUsernameModal = useCallback(() => setShowUsernameModal(true), []);
  const closeUsernameModal = useCallback(() => setShowUsernameModal(false), []);
  function handleUsernameSubmit(newUsername: string) {
    updateState("username", newUsername);
    closeUsernameModal();
  }

  const size = state.size as BannerSize;
  const fill = state.contentSize === "fill";
  // Disable settings that don't apply right now. A photo that failed can't be shown, Fill covers
  // the whole banner, and with no quote marks there's nothing to color.
  const disabledFields = new Set<string>();
  if (github.avatarFailed) disabledFields.add("showAvatar");
  if (fill) disabledFields.add("alignment");
  if (state.quoteMarks === "none") disabledFields.add("markColor");

  // The first missing setting the banner needs. The username comes first because nothing loads
  // without it. Then come required fields such as the quote.
  const missingSetting =
    needsUsername && !username.trim()
      ? "username"
      : definition.schema.find((field) => field.required && !String(state[field.key] ?? "").trim())
          ?.key;
  const previewState = computePreviewContentState({
    missingSetting,
    hasProblem: github.problem !== null,
    dataReady: github.dataReady,
  });

  const background = backgroundFromState(state);
  const backgroundImage = useBannerImage(state.backgroundImage, "background", showError);
  /** Only a chosen background that shows in the preview can be moved and zoomed. */
  const adjustableBackground = backgroundImage.usableSrc ? background : undefined;
  const logoImage = useBannerImage(state.logoImage, "logo", showError);

  const backgroundFields = useMemo(
    () => ({
      backgroundImage: backgroundImage.usableSrc,
      backgroundPosition: state.backgroundPosition,
      backgroundZoom: state.backgroundZoom,
    }),
    [backgroundImage.usableSrc, state.backgroundPosition, state.backgroundZoom],
  );
  // Keep the old background until the new one has loaded, so the banner is never left without
  // one.
  const shownBackground = useKeepWhile(backgroundFields, backgroundImage.status === "loading");
  const previewBannerState = useMemo(
    () => ({ ...state, ...shownBackground, logoImage: logoImage.usableSrc }),
    [state, shownBackground, logoImage.usableSrc],
  );
  // What the preview and the Download button show. They always change together. A fast load
  // keeps the previous preview instead of flashing the loading screen (see useHoldDuringLoad).
  const livePreview = useMemo(
    () => ({
      previewState,
      problem: github.problem,
      bannerState: previewBannerState,
      data: github.data,
    }),
    [previewState, github.problem, previewBannerState, github.data],
  );
  // Only hold a finished preview. An empty or error state goes straight to loading.
  const shownPreview = useHoldDuringLoad(
    livePreview,
    previewState === "loading",
    (preview) => preview.previewState === "ready",
  );
  // Download and Copy don't explain why they're off. The preview shows the empty, loading or
  // problem state, and a broken image gets a toast. They're also off while the preview shows an
  // older version, so a download always matches what's on screen. That covers a held preview, the
  // previous year's grid, the old background and a logo that's still loading.
  const exportBlocked =
    shownPreview.previewState !== "ready" ||
    backgroundImage.status === "failed" ||
    logoImage.status === "failed" ||
    shownPreview !== livePreview ||
    github.contributionsStale ||
    shownBackground !== backgroundFields ||
    logoImage.status === "loading";

  const bannerExport = useBannerExport({
    request: { templateId, size, state, pixelRatio, uiTheme: appTheme },
    format,
    showError,
    showSuccess,
    dismissToast,
  });

  return (
    <div className={styles.shell}>
      <Toast toast={toast} onDismiss={dismissToast} className={styles.toast} />
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
            onCopyEmbed={bannerExport.copyEmbed}
            banner={{ templateId, state, uiTheme: appTheme }}
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
            missingSetting={missingSetting}
            exporting={bannerExport.exporting !== null}
            onRetry={github.retry}
            onChangeUsername={openUsernameModal}
            onEditSetting={sidebar.focusSetting}
            backgroundAdjust={
              adjustableBackground
                ? {
                    position: adjustableBackground.position,
                    zoom: adjustableBackground.zoom,
                    onMove: (position: Position) => updateState("backgroundPosition", position),
                  }
                : undefined
            }
            contentAdjust={
              fill ? undefined : { position: contentPositionFromState(state), onMove: moveContent }
            }
            logoAdjust={
              logoImage.usableSrc
                ? {
                    position: logoPositionFromState(state),
                    onMove: (position: Position) => updateState("logoPosition", position),
                  }
                : undefined
            }
          />
        </main>
      </div>
    </div>
  );
}
