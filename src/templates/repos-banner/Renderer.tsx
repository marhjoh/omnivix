import { Frame } from "@/src/banner/Frame";
import { logoFromState } from "@/src/banner/logo";
import { backgroundFromState } from "@/src/banner/background";
import { FitContent } from "@/src/banner/FitContent";
import { contentBoxOf } from "@/src/banner/fit";
import { normalizeContentSize } from "@/src/banner/contentSize";
import { contentPositionFromState } from "@/src/banner/contentPosition";
import { RepoCard } from "@/src/banner/RepoCard";
import { ProfileBlock } from "@/src/banner/ProfileBlock";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { RenderData } from "@/src/templates/renderers/types";
import { reposShown } from "@/src/lib/repoSelection";

/** Columns per repository count (1–6), so 4 repositories make a 2×2 grid rather than 3 + 1. */
const COLUMNS_BY_COUNT = [1, 2, 3, 2, 3, 3];

function reposBannerColumnCount(count: number): number {
  return COLUMNS_BY_COUNT[Math.min(COLUMNS_BY_COUNT.length, count) - 1];
}

const REPO_GRID_GAP_PX = 10;
const REPO_CARD_COLUMN_PX = 250;

export function ReposBannerRenderer({
  state,
  data,
  uiTheme,
}: {
  state: Record<string, unknown>;
  data: RenderData;
  uiTheme: Theme;
}) {
  const chrome = bannerUiChrome(uiTheme);
  const background = backgroundFromState(state);
  const mode = state.mode === "selected" ? "selected" : "pinned";
  const shown = reposShown(mode, state.maxRepos);
  const repos = Array.isArray(data.repos) ? data.repos.slice(0, shown) : [];
  const username = typeof state.username === "string" ? state.username : "";
  // Selected mode lays out what was picked; pinned mode keeps the chosen amount's layout.
  const cols = reposBannerColumnCount(mode === "selected" ? Math.max(1, repos.length) : shown);

  const showDisplayName = state.showDisplayName === true;
  const showAvatar = state.showAvatar !== false;
  const profileRight = state.profilePosition === "right";
  const contentSize = normalizeContentSize(state.contentSize);

  const showDescription = state.showDescription !== false;
  const showLanguage = state.showLanguage !== false;
  const showStars = state.showStars !== false;
  const showForks = state.showForks !== false;

  return (
    <Frame uiTheme={uiTheme} background={background} logo={logoFromState(state)}>
      <FitContent
        box={contentBoxOf(state.size)}
        size={contentSize}
        position={contentPositionFromState(state)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <ProfileBlock
            user={data.user}
            username={username}
            chrome={chrome}
            showAvatar={showAvatar}
            showDisplayName={showDisplayName}
            right={profileRight}
          />
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
        </div>
      </FitContent>
    </Frame>
  );
}
