import { ContributionGrid } from "@/src/banner/ContributionGrid";
import { ProfileColumn } from "@/src/banner/ProfileBlock";
import { FitContent } from "@/src/banner/FitContent";
import { normalizeContentSize } from "@/src/banner/contentSize";
import { contentFit } from "@/src/banner/contentPosition";
import { contributionCellShapeFromState } from "@/src/templates/definitions";
import { bannerUiChrome } from "@/src/theme/theme";
import { themePresetById } from "@/src/types/theme";
import type { RendererProps } from "@/src/templates/renderers/types";

/** Natural sizes; `FitContent` scales the whole block to the chosen size and banner format. */
const GRID = { cell: 10, gap: 2 };

export function GithubBannerRenderer({ state, data, uiTheme }: RendererProps) {
  const chrome = bannerUiChrome(uiTheme);

  return (
    <FitContent {...contentFit(state)} size={normalizeContentSize(state.contentSize)}>
      <ProfileColumn state={state} user={data.user} chrome={chrome}>
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
              theme={themePresetById(state.themeId)}
              cellSize={GRID.cell}
              gap={GRID.gap}
              showMonthLabels={state.showMonthLabels !== false}
              showDayLabels={state.showDayLabels !== false}
              showTotal={state.showTotal !== false}
              cellOutline
              cellShape={contributionCellShapeFromState(state.cellShape)}
            />
          ) : null}
        </div>
      </ProfileColumn>
    </FitContent>
  );
}
