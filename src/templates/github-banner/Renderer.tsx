import { Frame } from "@/src/banner/Frame";
import { ContributionGrid } from "@/src/banner/ContributionGrid";
import { BannerMuted, BannerTitle } from "@/src/banner/Text";
import { THEME_PRESETS } from "@/src/types/theme";
import { RenderData } from "@/src/templates/renderers/types";

const GRID_SIZES: Record<string, { cell: number; gap: number; avatar: number; title: number; sub: number }> = {
  xs:  { cell: 6,  gap: 2, avatar: 32, title: 16, sub: 11 },
  s:   { cell: 9,  gap: 2, avatar: 44, title: 20, sub: 12 },
  m:   { cell: 13, gap: 3, avatar: 56, title: 24, sub: 14 },
  l:   { cell: 17, gap: 3, avatar: 68, title: 28, sub: 16 },
  xl:  { cell: 22, gap: 4, avatar: 80, title: 32, sub: 18 },
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
  const theme = THEME_PRESETS.find((preset) => preset.id === state.themeId) ?? THEME_PRESETS[0];
  const backgroundImage = typeof state.backgroundImage === "string" ? state.backgroundImage : undefined;
  const username = typeof state.username === "string" ? state.username : "";

  const showMonthLabels = state.showMonthLabels !== false;
  const showDayLabels = state.showDayLabels !== false;
  const showTotal = state.showTotal !== false;
  const profileRight = (state.profilePosition as string) === "right";
  const gridAlign = (state.gridAlign as string) ?? "left";
  const sizeKey = (state.gridSize as string) ?? "m";
  const sizing = GRID_SIZES[sizeKey] ?? GRID_SIZES.m;

  if (!username) {
    return (
      <Frame isExport={isExport} style={{ background: theme.background, color: theme.textPrimary }}>
        <div style={{ display: "grid", placeItems: "center", height: "100%", opacity: 0.35, textAlign: "center", gap: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/icon.svg" alt="" style={{ width: 40, height: 40, margin: "0 auto" }} />
          <p style={{ fontSize: 16 }}>Select a GitHub profile to get started</p>
        </div>
      </Frame>
    );
  }

  return (
    <Frame backgroundImage={backgroundImage} isExport={isExport} style={{ background: theme.background, color: theme.textPrimary }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: FLEX_ALIGN[gridAlign] ?? "flex-start",
          padding: "24px 30px",
          height: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            width: "fit-content",
            maxWidth: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: profileRight ? "flex-end" : "flex-start",
            }}
          >
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              {data.user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.user.avatarUrl}
                  alt=""
                  style={{ width: sizing.avatar, height: sizing.avatar, borderRadius: "50%", flexShrink: 0 }}
                />
              ) : null}
              <div style={{ minWidth: 0, textAlign: profileRight ? "right" : "left" }}>
                <BannerTitle style={{ fontSize: sizing.title }}>{data.user?.name ?? username}</BannerTitle>
                <BannerMuted style={{ fontSize: sizing.sub }}>@{data.user?.login ?? username}</BannerMuted>
              </div>
            </div>
          </div>

          <div style={{ overflow: "hidden" }}>
            {data.contributions ? (
              <ContributionGrid
                contributions={data.contributions}
                theme={theme}
                cellSize={sizing.cell}
                gap={sizing.gap}
                showMonthLabels={showMonthLabels}
                showDayLabels={showDayLabels}
                showTotal={showTotal}
              />
            ) : null}
          </div>
        </div>
      </div>
    </Frame>
  );
}
