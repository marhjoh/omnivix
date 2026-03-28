import { contributionCellShapeFromState } from "@/src/templates/definitions";
import { Frame } from "@/src/banner/Frame";
import { ContributionGrid } from "@/src/banner/ContributionGrid";
import { BannerMuted, BannerTitle } from "@/src/banner/Text";
import { THEME_PRESETS } from "@/src/types/theme";
import { RenderData } from "@/src/templates/renderers/types";

/** Banner chrome stays fixed; theme only recolors contribution cells (gridLevels). */
const BANNER_BASE_BG = "#0d1117";
const PROFILE_TEXT = "rgba(255,255,255,0.92)";
const PROFILE_MUTED = "rgba(255,255,255,0.58)";
const GRID_OVERLAY_BG = "rgba(13, 17, 23, 0.82)";
const GRID_OVERLAY_BORDER = "rgba(255, 255, 255, 0.1)";

/**
 * cell + gap = step (week column pitch). ~53 GitHub week columns:
 *   svgW ≈ dayLabelWidth(28) + 53*step - gap
 * XL uses step 18 (15+3) so svgW ≈ 979px — under ~1000px for preview/export headroom;
 * gap 3 matches L so XL scales cells up without a looser column rhythm than L (15+4 looked “wide” vs 12+3).
 */
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
}: {
  state: Record<string, unknown>;
  data: RenderData;
  isExport?: boolean;
}) {
  const gridTheme = THEME_PRESETS.find((preset) => preset.id === state.themeId) ?? THEME_PRESETS[0];
  const backgroundImage = typeof state.backgroundImage === "string" ? state.backgroundImage : undefined;
  const username = typeof state.username === "string" ? state.username : "";
  const showDisplayName = state.showDisplayName === true;

  const showMonthLabels = state.showMonthLabels !== false;
  const showDayLabels = state.showDayLabels !== false;
  const showTotal = state.showTotal !== false;
  const profileRight = (state.profilePosition as string) === "right";
  const gridPosition = (((state.gridPosition ?? state.gridAlign) as string) || "left") as keyof typeof FLEX_ALIGN;
  const sizeKey = (state.gridSize as string) ?? "m";
  const sizing = GRID_SIZES[sizeKey] ?? GRID_SIZES.m;
  const cellShape = contributionCellShapeFromState(state.cellShape);

  const login = data.user?.login ?? username;
  const displayName = data.user?.name?.trim();

  if (!username) {
    return (
      <Frame isExport={isExport} style={{ background: BANNER_BASE_BG, color: PROFILE_TEXT }}>
        <div style={{ display: "grid", placeItems: "center", height: "100%", opacity: 0.35, textAlign: "center", gap: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/icon.svg" alt="" style={{ width: 40, height: 40, margin: "0 auto" }} />
          <p style={{ fontSize: 16 }}>Select a GitHub profile to get started</p>
        </div>
      </Frame>
    );
  }

  return (
    <Frame backgroundImage={backgroundImage} isExport={isExport} style={{ background: BANNER_BASE_BG, color: PROFILE_TEXT }}>
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
                    <BannerTitle style={{ fontSize: sizing.name, lineHeight: 1.15, margin: "0 0 2px", color: PROFILE_TEXT }}>
                      {displayName}
                    </BannerTitle>
                    <BannerMuted style={{ fontSize: sizing.handle, color: PROFILE_MUTED, margin: 0 }}>@{login}</BannerMuted>
                  </>
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontSize: sizing.handle,
                      fontWeight: 600,
                      lineHeight: 1.2,
                      color: PROFILE_TEXT,
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
              background: GRID_OVERLAY_BG,
              border: `1px solid ${GRID_OVERLAY_BORDER}`,
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
                labelFill={PROFILE_TEXT}
                totalFill={PROFILE_TEXT}
                cellShape={cellShape}
              />
            ) : null}
          </div>
        </div>
      </div>
    </Frame>
  );
}
