import { ContributionGrid } from "@/src/banner/ContributionGrid";
import { Frame } from "@/src/banner/Frame";
import { contributionCellShapeFromState } from "@/src/templates/definitions";
import { BannerMuted, BannerTitle } from "@/src/banner/Text";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { THEME_PRESETS } from "@/src/types/theme";
import { RenderData } from "@/src/templates/renderers/types";

/** Calendar-aligned grid: columnCount = GitHub weeks.length, cells placed by weekday row. */
const GRID_SIZES: Record<
  string,
  { cell: number; gap: number; avatar: number; name: number; handle: number }
> = {
  xs: { cell: 6, gap: 2, avatar: 20, name: 10, handle: 10 },
  s: { cell: 8, gap: 2, avatar: 24, name: 12, handle: 11 },
  m: { cell: 10, gap: 2, avatar: 28, name: 13, handle: 12 },
  l: { cell: 12, gap: 3, avatar: 32, name: 15, handle: 13 },
  xl: { cell: 15, gap: 3, avatar: 36, name: 17, handle: 14 },
};

const FLEX_ALIGN: Record<string, string> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

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
  const backgroundImage = typeof state.backgroundImage === "string" ? state.backgroundImage : undefined;
  const username = typeof state.username === "string" ? state.username : "";
  const showDisplayName = state.showDisplayName === true;

  const showMonthLabels = state.showMonthLabels !== false;
  const showDayLabels = state.showDayLabels === true;
  const showTotal = state.showTotal !== false;
  const profileRight = (state.profilePosition as string) === "right";
  const gridPosition = (((state.gridPosition ?? state.gridAlign) as string) || "center") as keyof typeof FLEX_ALIGN;
  const sizeKey = (state.gridSize as string) ?? "m";
  const sizing = GRID_SIZES[sizeKey] ?? GRID_SIZES.m;
  const cellShape = contributionCellShapeFromState(state.cellShape);

  const login = data.user?.login ?? username;
  const displayName = data.user?.name?.trim();

  if (!username) {
    return (
      <Frame appTheme={uiTheme} isExport={isExport} style={{ background: chrome.baseBg, color: chrome.text }}>
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
          <img src={chrome.emptyStateIconSrc} alt="" style={{ width: 40, height: 40, margin: "0 auto" }} />
          <p style={{ fontSize: 16, color: chrome.text }}>Select a GitHub profile to get started</p>
        </div>
      </Frame>
    );
  }

  return (
    <Frame
      appTheme={uiTheme}
      backgroundImage={backgroundImage}
      isExport={isExport}
      style={{ background: chrome.baseBg, color: chrome.text }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: FLEX_ALIGN[gridPosition] ?? "flex-start",
          padding: "14px 20px",
          height: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            width: "fit-content",
            maxWidth: "100%",
            minWidth: 0,
          }}
        >
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
              {data.user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.user.avatarUrl}
                  alt=""
                  style={{ width: sizing.avatar, height: sizing.avatar, borderRadius: "50%", flexShrink: 0 }}
                />
              ) : null}
              <div style={{ minWidth: 0, textAlign: profileRight ? "right" : "left" }}>
                {showDisplayName && displayName ? (
                  <>
                    <BannerTitle style={{ fontSize: sizing.name, lineHeight: 1.15, margin: "0 0 2px", color: chrome.text }}>
                      {displayName}
                    </BannerTitle>
                    <BannerMuted style={{ fontSize: sizing.handle, color: chrome.textMuted, margin: 0 }}>@{login}</BannerMuted>
                  </>
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontSize: sizing.handle,
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
              width: "fit-content",
              maxWidth: "100%",
              minWidth: 0,
              overflow: "hidden",
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
                cellSize={sizing.cell}
                gap={sizing.gap}
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
      </div>
    </Frame>
  );
}
