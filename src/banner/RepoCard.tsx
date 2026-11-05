import type { RepoNormalized } from "@/src/github/types";
import { ELLIPSIS, lineClamp } from "@/src/banner/textStyle";
import type { BannerUiChrome } from "@/src/theme/theme";

interface RepoCardProps {
  repo: RepoNormalized;
  showDescription: boolean;
  showLanguage: boolean;
  showStars: boolean;
  showForks: boolean;
  chrome: BannerUiChrome;
}

const STAR_COLOR = "#f2cc60";
const FORK_COLOR = "#b392f0";

export function RepoCard({
  repo,
  showDescription,
  showLanguage,
  showStars,
  showForks,
  chrome,
}: RepoCardProps) {
  const hasFooter = showLanguage || showStars || showForks;
  const pill = { padding: "2px 7px", borderRadius: 999, background: chrome.pillBg };

  return (
    <article
      style={{
        border: `1px solid ${chrome.cardBorder}`,
        borderRadius: 10,
        padding: "10px 14px",
        background: chrome.cardBg,
        color: chrome.cardText,
        minWidth: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        boxShadow: chrome.cardShadow,
      }}
    >
      {/* Not a heading: the preview is one image to screen readers. */}
      <p
        style={{
          fontSize: 15,
          margin: 0,
          marginBottom: showDescription || hasFooter ? 4 : 0,
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          ...ELLIPSIS,
        }}
      >
        {repo.name}
      </p>

      {showDescription && (
        <p
          style={{
            fontSize: 11,
            color: chrome.cardTextMuted,
            margin: 0,
            ...lineClamp(1),
            lineHeight: 1.28,
            wordBreak: "break-word",
          }}
        >
          {repo.description ?? "No description"}
        </p>
      )}

      {hasFooter && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            fontSize: 11,
            color: chrome.cardTextMuted,
            marginTop: showDescription ? 6 : 4,
            alignItems: "center",
            lineHeight: 1.35,
          }}
        >
          {showLanguage && repo.language && (
            <span
              style={{
                ...pill,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {repo.languageColor && (
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: repo.languageColor,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
              )}
              {repo.language}
            </span>
          )}
          {showStars && (
            <span style={{ ...pill, whiteSpace: "nowrap" }}>
              <span style={{ color: STAR_COLOR }}>★</span> {repo.stargazers}
            </span>
          )}
          {showForks && (
            <span style={{ ...pill, whiteSpace: "nowrap" }}>
              <span style={{ color: FORK_COLOR }}>⑂</span> {repo.forks}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
