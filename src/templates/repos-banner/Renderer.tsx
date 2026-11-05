import { RepoCard } from "@/src/banner/RepoCard";
import { ProfileBanner } from "@/src/banner/ProfileBlock";
import { bannerUiChrome } from "@/src/theme/theme";
import type { RendererProps } from "@/src/templates/types";
import { repoModeOf, reposShown } from "@/src/lib/repoSelection";

/** Columns per repository count (1–6), so 4 repositories make a 2×2 grid rather than 3 + 1. */
const COLUMNS_BY_COUNT = [1, 2, 3, 2, 3, 3];

const REPO_GRID_GAP_PX = 10;
const REPO_CARD_COLUMN_PX = 250;

export function ReposBannerRenderer({ state, data, uiTheme }: RendererProps) {
  const chrome = bannerUiChrome(uiTheme);
  const mode = repoModeOf(state.mode);
  const shown = reposShown(mode, state.maxRepos);
  const repos = data.repos?.slice(0, shown) ?? [];
  // Selected mode lays out what was picked; pinned mode keeps the chosen amount's layout.
  const cols = COLUMNS_BY_COUNT[(mode === "selected" ? Math.max(1, repos.length) : shown) - 1];

  const showDescription = state.showDescription !== false;
  const showLanguage = state.showLanguage !== false;
  const showStars = state.showStars !== false;
  const showForks = state.showForks !== false;

  return (
    <ProfileBanner state={state} user={data.user} chrome={chrome}>
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
            chrome={chrome}
            showDescription={showDescription}
            showLanguage={showLanguage}
            showStars={showStars}
            showForks={showForks}
          />
        ))}
      </div>
    </ProfileBanner>
  );
}
