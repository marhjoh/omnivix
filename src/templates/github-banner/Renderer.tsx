import { ContributionGrid } from "@/src/banner/ContributionGrid";
import { Frame } from "@/src/banner/Frame";
import { logoFromState } from "@/src/banner/logo";
import { ProfileBlock } from "@/src/banner/ProfileBlock";
import { backgroundFromState } from "@/src/banner/background";
import { FitContent } from "@/src/banner/FitContent";
import { contentBoxOf } from "@/src/banner/fit";
import { normalizeContentSize } from "@/src/banner/contentSize";
import { contentPositionFromState } from "@/src/banner/contentPosition";
import { contributionCellShapeFromState } from "@/src/templates/definitions";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { themePresetById } from "@/src/types/theme";
import { RenderData } from "@/src/templates/renderers/types";

/** Natural sizes; `FitContent` scales the whole block to the chosen size and banner format. */
const GRID = { cell: 10, gap: 2 };

export function GithubBannerRenderer({
  state,
  data,
  uiTheme,
}: {
  state: Record<string, unknown>;
  data: RenderData;
  uiTheme: Theme;
}) {
  const chrome = bannerUiChrome(uiTheme);

  return (
    <Frame uiTheme={uiTheme} background={backgroundFromState(state)} logo={logoFromState(state)}>
      <FitContent
        box={contentBoxOf(state.size)}
        size={normalizeContentSize(state.contentSize)}
        position={contentPositionFromState(state)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <ProfileBlock
            user={data.user}
            username={typeof state.username === "string" ? state.username : ""}
            chrome={chrome}
            showAvatar={state.showAvatar !== false}
            showDisplayName={state.showDisplayName === true}
            right={state.profilePosition === "right"}
          />
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
        </div>
      </FitContent>
    </Frame>
  );
}
