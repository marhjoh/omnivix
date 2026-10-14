import { ContributionGrid } from "@/src/banner/ContributionGrid";
import { Frame } from "@/src/banner/Frame";
import { FitContent } from "@/src/banner/FitContent";
import { normalizeContentSize } from "@/src/banner/contentSize";
import { normalizeContentAlign } from "@/src/banner/contentAlign";
import { contributionCellShapeFromState } from "@/src/templates/definitions";
import { BannerMuted, BannerTitle } from "@/src/banner/Text";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { THEME_PRESETS } from "@/src/types/theme";
import { RenderData } from "@/src/templates/renderers/types";

/** Natural sizes; `FitContent` scales the whole block to the chosen size and banner format. */
const SIZING = { cell: 10, gap: 2, avatar: 28, name: 13, handle: 12 };

export function GithubBannerRenderer({
  state,
  data,
  isExport = false,
  uiTheme = "dark",
}: {
  state: Record<string, unknown>;
  data: RenderData;
  isExport?: boolean;
  uiTheme?: Theme;
}) {
  const chrome = bannerUiChrome(uiTheme);
  const gridTheme = THEME_PRESETS.find((preset) => preset.id === state.themeId) ?? THEME_PRESETS[0];
  const backgroundImage =
    typeof state.backgroundImage === "string" ? state.backgroundImage : undefined;
  const username = typeof state.username === "string" ? state.username : "";
  const showDisplayName = state.showDisplayName === true;
  const showAvatar = state.showAvatar !== false;

  const showMonthLabels = state.showMonthLabels !== false;
  const showDayLabels = state.showDayLabels !== false;
  const showTotal = state.showTotal !== false;
  const profileRight = (state.profilePosition as string) === "right";
  const alignment = normalizeContentAlign(state.alignment);
  const contentSize = normalizeContentSize(state.contentSize);
  const cellShape = contributionCellShapeFromState(state.cellShape);

  const login = data.user?.login ?? username;
  const displayName = data.user?.name?.trim();

  if (!username) {
    return (
      <Frame appTheme={uiTheme} style={{ background: chrome.baseBg, color: chrome.text }}>
        <div
          style={{
            display: "grid",
            placeItems: "center",
            height: "100%",
            opacity: 0.55,
            textAlign: "center",
            gap: 8,
            color: chrome.textMuted,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={chrome.emptyStateIconSrc}
            alt=""
            style={{ width: 40, height: 40, margin: "0 auto" }}
          />
          <p style={{ fontSize: 16, color: chrome.text }}>Select a GitHub profile to get started</p>
        </div>
      </Frame>
    );
  }

  return (
    <Frame
      appTheme={uiTheme}
      backgroundImage={backgroundImage}
      style={{ background: chrome.baseBg, color: chrome.text }}
    >
      <FitContent size={contentSize} align={alignment}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              display: "flex",
              width: "100%",
              minWidth: 0,
              justifyContent: profileRight ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: showDisplayName && displayName ? 8 : 6,
                alignItems: "center",
              }}
            >
              {showAvatar && data.user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.user.avatarUrl}
                  alt=""
                  style={{
                    width: SIZING.avatar,
                    height: SIZING.avatar,
                    borderRadius: "50%",
                    flexShrink: 0,
                  }}
                />
              ) : null}
              <div style={{ minWidth: 0, textAlign: profileRight ? "right" : "left" }}>
                {showDisplayName && displayName ? (
                  <>
                    <BannerTitle
                      style={{
                        fontSize: SIZING.name,
                        lineHeight: 1.15,
                        margin: "0 0 2px",
                        color: chrome.text,
                      }}
                    >
                      {displayName}
                    </BannerTitle>
                    <BannerMuted
                      style={{ fontSize: SIZING.handle, color: chrome.textMuted, margin: 0 }}
                    >
                      @{login}
                    </BannerMuted>
                  </>
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontSize: SIZING.handle,
                      fontWeight: 600,
                      lineHeight: 1.2,
                      color: chrome.text,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    @{login}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              borderRadius: 12,
              padding: "12px 14px",
              background: chrome.gridOverlayBg,
              border: `1px solid ${chrome.gridOverlayBorder}`,
              boxSizing: "border-box",
              ...(isExport
                ? {}
                : {
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                  }),
            }}
          >
            {data.contributions ? (
              <ContributionGrid
                contributions={data.contributions}
                theme={gridTheme}
                cellSize={SIZING.cell}
                gap={SIZING.gap}
                showMonthLabels={showMonthLabels}
                showDayLabels={showDayLabels}
                showTotal={showTotal}
                cellOutline
                labelFill={chrome.text}
                totalFill={chrome.text}
                cellShape={cellShape}
              />
            ) : null}
          </div>
        </div>
      </FitContent>
    </Frame>
  );
}
