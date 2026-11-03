import { FitContent } from "@/src/banner/FitContent";
import { normalizeContentSize } from "@/src/banner/contentSize";
import { contentFit } from "@/src/banner/contentPosition";
import { RepoCard } from "@/src/banner/RepoCard";
import { ProfileColumn } from "@/src/banner/ProfileBlock";
import { bannerUiChrome } from "@/src/theme/theme";
import type { RendererProps } from "@/src/templates/renderers/types";
import { reposShown } from "@/src/lib/repoSelection";

/** Columns per repository count (1–6), so 4 repositories make a 2×2 grid rather than 3 + 1. */
const COLUMNS_BY_COUNT = [1, 2, 3, 2, 3, 3];

function reposBannerColumnCount(count: number): number {
  return COLUMNS_BY_COUNT[Math.min(COLUMNS_BY_COUNT.length, count) - 1];
}

const REPO_GRID_GAP_PX = 10;
const REPO_CARD_COLUMN_PX = 250;

export function ReposBannerRenderer({ state, data, uiTheme }: RendererProps) {
  const chrome = bannerUiChrome(uiTheme);
  const mode = state.mode === "selected" ? "selected" : "pinned";
  const shown = reposShown(mode, state.maxRepos);
  const repos = data.repos?.slice(0, shown) ?? [];
  // Selected mode lays out what was picked; pinned mode keeps the chosen amount's layout.
  const cols = reposBannerColumnCount(mode === "selected" ? Math.max(1, repos.length) : shown);

  const showDescription = state.showDescription !== false;
  const showLanguage = state.showLanguage !== false;
  const showStars = state.showStars !== false;
  const showForks = state.showForks !== false;

  return (
    <FitContent {...contentFit(state)} size={normalizeContentSize(state.contentSize)}>
      <ProfileColumn state={state} user={data.user} chrome={chrome}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${REPO_CARD_COLUMN_PX}px)`,
            gap: REPO_GRID_GAP_PX,
            alignItems: "start",
          }}
        >
          {repos.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              uiTheme={uiTheme}
              showDescription={showDescription}
              showLanguage={showLanguage}
              showStars={showStars}
              showForks={showForks}
            />
          ))}
        </div>
      </ProfileColumn>
    </FitContent>
  );
}
