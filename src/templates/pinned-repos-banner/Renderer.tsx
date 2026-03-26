import { Frame } from "@/src/banner/Frame";
import { RepoCard } from "@/src/banner/RepoCard";
import { BannerTitle } from "@/src/banner/Text";
import { RenderData } from "@/src/templates/renderers/types";
import { THEME_PRESETS } from "@/src/types/theme";

export function PinnedReposBannerRenderer({
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
  const mode = (state.mode === "selected" ? "selected" : "pinned") as "pinned" | "selected";
  const maxRepos = Number(state.maxRepos ?? 6);
  const repos = Array.isArray(data.repos) ? data.repos.slice(0, maxRepos) : [];
  const username = typeof state.username === "string" ? state.username : "";

  const showDescription = state.showDescription !== false;
  const showLanguage = state.showLanguage !== false;
  const showStars = state.showStars !== false;
  const showForks = state.showForks !== false;

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

  const cols = repos.length <= 3 ? repos.length || 1 : 3;

  return (
    <Frame backgroundImage={backgroundImage} isExport={isExport} style={{ background: theme.background, color: theme.textPrimary }}>
      <div style={{ display: "grid", gap: 14, padding: 24, height: "100%", alignContent: "start" }}>
        <BannerTitle>{mode === "selected" ? "Selected Repositories" : "Featured Repositories"}</BannerTitle>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 12 }}>
          {repos.length > 0 ? (
            repos.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                showDescription={showDescription}
                showLanguage={showLanguage}
                showStars={showStars}
                showForks={showForks}
              />
            ))
          ) : (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: 24,
                border: "1px dashed rgba(255,255,255,0.12)",
                borderRadius: 12,
                color: theme.textSecondary,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/icon.svg" alt="" style={{ width: 32, height: 32, opacity: 0.4 }} />
              <p style={{ fontSize: 14, fontWeight: 500 }}>
                {mode === "selected" ? "No matching repositories" : "No pinned repositories"}
              </p>
              <p style={{ fontSize: 12, opacity: 0.7, maxWidth: 280 }}>
                {mode === "selected"
                  ? "Add comma-separated repo names in the sidebar to display them here."
                  : "Pin repositories on your GitHub profile, or switch to Selected mode."}
              </p>
            </div>
          )}
        </div>
      </div>
    </Frame>
  );
}
