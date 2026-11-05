import { ContributionGrid, contributionGridStyle } from "@/src/banner/ContributionGrid";
import { ProfileBanner } from "@/src/banner/ProfileBlock";
import { bannerUiChrome } from "@/src/theme/theme";
import type { RendererProps } from "@/src/templates/types";

/** Cell size before FitContent scales the content. */
const GRID = { cell: 10, gap: 2 };

export function GithubBannerRenderer({ state, data, uiTheme }: RendererProps) {
  const chrome = bannerUiChrome(uiTheme);

  return (
    <ProfileBanner state={state} user={data.user} chrome={chrome}>
      <div
        style={{
          borderRadius: 12,
          padding: "12px 14px",
          background: chrome.gridOverlayBg,
          border: `1px solid ${chrome.gridOverlayBorder}`,
          boxSizing: "border-box",
        }}
      >
        {data.contributions ? (
          <ContributionGrid
            contributions={data.contributions}
            {...contributionGridStyle(state)}
            cellSize={GRID.cell}
            gap={GRID.gap}
            showMonthLabels={state.showMonthLabels !== false}
            showDayLabels={state.showDayLabels !== false}
            showTotal={state.showTotal !== false}
          />
        ) : null}
      </div>
    </ProfileBanner>
  );
}
