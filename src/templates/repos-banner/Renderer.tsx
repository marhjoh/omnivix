import { Frame } from "@/src/banner/Frame";
import { RepoCard } from "@/src/banner/RepoCard";
import { BannerMuted, BannerTitle } from "@/src/banner/Text";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { RenderData } from "@/src/templates/renderers/types";
import type { GithubUserNormalized } from "@/src/github/normalize";

type ProfileSizing = { avatar: number; name: number; handle: number };

/** Profile avatar / name: tied to banner Type only (no extra size control). */
const PROFILE_BY_BANNER_TYPE: Record<"xHeader" | "linkedinCover", ProfileSizing> = {
  xHeader: { avatar: 24, name: 12, handle: 11 },
  linkedinCover: { avatar: 28, name: 13, handle: 12 },
};

function profileSizingForBannerType(size: unknown): ProfileSizing {
  return size === "xHeader" ? PROFILE_BY_BANNER_TYPE.xHeader : PROFILE_BY_BANNER_TYPE.linkedinCover;
}

const FLEX_ALIGN: Record<string, string> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

/** Column count follows the chosen amount (1–6) for a stable layout. */
function reposBannerColumnCount(amount: number): number {
  const n = Math.min(6, Math.max(1, Number.isFinite(amount) ? Math.round(amount) : 1));
  if (n <= 1) return 1;
  if (n === 2) return 2;
  if (n === 3) return 3;
  if (n === 4) return 2;
  return 3;
}

const REPO_GRID_GAP_PX = 10;
const REPO_CARD_COLUMN_MAX_PX = 220;

function ProfileBlock({
  user,
  username,
  chrome,
  showDisplayName,
  sizing,
}: {
  user: GithubUserNormalized | undefined;
  username: string;
  chrome: ReturnType<typeof bannerUiChrome>;
  showDisplayName: boolean;
  sizing: ProfileSizing;
}) {
  const login = user?.login ?? username;
  const displayName = user?.name?.trim();

  return (
    <div
      style={{
        display: "flex",
        width: "max-content",
        maxWidth: "100%",
        minWidth: 0,
        justifyContent: "flex-start",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: showDisplayName && displayName ? 8 : 6,
          alignItems: "center",
        }}
      >
        {user?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            style={{ width: sizing.avatar, height: sizing.avatar, borderRadius: "50%", flexShrink: 0 }}
          />
        ) : null}
        <div style={{ minWidth: 0, textAlign: "left" }}>
          {showDisplayName && displayName ? (
            <>
              <BannerTitle
                style={{ fontSize: sizing.name, lineHeight: 1.15, margin: "0 0 2px", color: chrome.text }}
              >
                {displayName}
              </BannerTitle>
              <BannerMuted style={{ fontSize: sizing.handle, color: chrome.textMuted, margin: 0 }}>
                @{login}
              </BannerMuted>
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
  );
}

export function ReposBannerRenderer({
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
  const backgroundImage = typeof state.backgroundImage === "string" ? state.backgroundImage : undefined;
  const mode = (state.mode === "selected" ? "selected" : "pinned") as "pinned" | "selected";
  const maxReposPinned = Math.min(6, Math.max(1, Number(state.maxRepos ?? 6)));
  const maxShown = mode === "selected" ? 6 : maxReposPinned;
  const repos = Array.isArray(data.repos) ? data.repos.slice(0, maxShown) : [];
  const username = typeof state.username === "string" ? state.username : "";
  const layoutAmount =
    mode === "selected"
      ? Math.min(6, Math.max(1, repos.length))
      : maxReposPinned;
  const cols = reposBannerColumnCount(layoutAmount);

  const showDisplayName = state.showDisplayName === true;
  const gridPosition = (((state.gridPosition ?? state.gridAlign) as string) || "center") as keyof typeof FLEX_ALIGN;
  const sizing = profileSizingForBannerType(state.size);

  const showDescription = state.showDescription !== false;
  const showLanguage = state.showLanguage !== false;
  const showStars = state.showStars !== false;
  const showForks = state.showForks !== false;

  if (!username) {
    return (
      <Frame appTheme={uiTheme} isExport={isExport} style={{ background: chrome.baseBg, color: chrome.text }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 8,
            textAlign: "center",
            padding: "0 20px",
            boxSizing: "border-box",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={chrome.emptyStateIconSrc}
            alt=""
            style={{ width: 40, height: 40, flexShrink: 0, opacity: 0.55 }}
          />
          <p
            style={{
              fontSize: 16,
              fontWeight: 400,
              lineHeight: 1.45,
              color: chrome.text,
              margin: 0,
              maxWidth: 320,
            }}
          >
            Select a GitHub profile to get started
          </p>
        </div>
      </Frame>
    );
  }

  const user = data.user;

  if (repos.length === 0) {
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
            padding: "12px 20px",
            height: "100%",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              width: "fit-content",
              maxWidth: "100%",
              minWidth: 0,
              alignItems: "stretch",
            }}
          >
            <ProfileBlock
              user={user}
              username={username}
              chrome={chrome}
              showDisplayName={showDisplayName}
              sizing={sizing}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                textAlign: "left",
                gap: 6,
                maxWidth: 300,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={chrome.emptyStateIconSrc}
                alt=""
                style={{ width: 40, height: 40, flexShrink: 0, opacity: 0.55 }}
              />
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: 1.45,
                  color: chrome.text,
                  margin: 0,
                }}
              >
                {mode === "selected" ? "No matching repositories" : "No pinned repositories"}
              </p>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: chrome.textMuted,
                  margin: 0,
                }}
              >
                {mode === "selected"
                  ? "Choose public repositories from the list in the sidebar."
                  : "Pin repositories on your GitHub profile, or switch to Selected mode."}
              </p>
            </div>
          </div>
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
          padding: "12px 20px",
          height: "100%",
          width: "100%",
          boxSizing: "border-box",
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
          <ProfileBlock
            user={user}
            username={username}
            chrome={chrome}
            showDisplayName={showDisplayName}
            sizing={sizing}
          />
          <div
            style={{
              display: "grid",
              width: "max-content",
              maxWidth: "100%",
              minWidth: 0,
              gridTemplateColumns: `repeat(${cols}, minmax(0, ${REPO_CARD_COLUMN_MAX_PX}px))`,
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
      </div>
    </Frame>
  );
}
