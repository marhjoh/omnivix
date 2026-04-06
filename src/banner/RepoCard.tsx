import { RepoNormalized } from "@/src/github/normalize";
import type { ThemePreset } from "@/src/types/theme";

/** Single scale tuned for banner grid cells (readable, even rhythm). */
const CARD = {
  title: 15,
  /** One-line teaser so cards stay short when description is on. */
  body: 11,
  footer: 11,
  padX: 14,
  padY: 10,
  radius: 10,
  gapTitle: 4,
  gapFooter: 6,
  footerItemGap: 8,
} as const;

interface RepoCardProps {
  repo: RepoNormalized;
  showDescription?: boolean;
  showLanguage?: boolean;
  showStars?: boolean;
  showForks?: boolean;
  preset: ThemePreset;
}

export function RepoCard({
  repo,
  showDescription = true,
  showLanguage = true,
  showStars = true,
  showForks = true,
  preset,
}: RepoCardProps) {
  const hasFooter = showLanguage || showStars || showForks;
  const borderColor = preset.gridLevels[0];

  return (
    <article
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: CARD.radius,
        padding: `${CARD.padY}px ${CARD.padX}px`,
        background: preset.surface,
        color: preset.textPrimary,
        minWidth: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h4
        style={{
          fontSize: CARD.title,
          margin: 0,
          marginBottom: showDescription ? CARD.gapTitle : hasFooter ? CARD.gapTitle : 0,
          color: preset.textPrimary,
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {repo.name}
      </h4>

      {showDescription && (
        <p
          style={{
            fontSize: CARD.body,
            color: preset.textSecondary,
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
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
            flexDirection: "row",
            flexWrap: "wrap",
            gap: CARD.footerItemGap,
            fontSize: CARD.footer,
            color: preset.textSecondary,
            marginTop: showDescription ? CARD.gapFooter : CARD.gapTitle,
            alignItems: "center",
            lineHeight: 1.35,
          }}
        >
          {showLanguage && repo.language && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
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
          {showStars && <span style={{ whiteSpace: "nowrap" }}>★ {repo.stargazers}</span>}
          {showForks && <span style={{ whiteSpace: "nowrap" }}>⑂ {repo.forks}</span>}
        </div>
      )}
    </article>
  );
}
