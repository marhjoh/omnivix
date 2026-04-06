import { RepoNormalized } from "@/src/github/normalize";
import type { Theme } from "@/src/theme/theme";

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
  uiTheme?: Theme;
}

export function RepoCard({
  repo,
  showDescription = true,
  showLanguage = true,
  showStars = true,
  showForks = true,
  uiTheme = "dark",
}: RepoCardProps) {
  const hasFooter = showLanguage || showStars || showForks;
  const cardChrome =
    uiTheme === "light"
      ? {
          bg: "rgba(255, 255, 255, 0.94)",
          border: "rgba(31, 35, 40, 0.12)",
          title: "#1f2328",
          body: "#656d76",
          pillBg: "rgba(31, 35, 40, 0.06)",
          star: "#f2cc60",
          fork: "#b392f0",
          shadow: "0 8px 24px rgba(31, 35, 40, 0.08)",
        }
      : {
          bg: "rgba(21, 28, 40, 0.82)",
          border: "rgba(255, 255, 255, 0.12)",
          title: "rgba(255,255,255,0.94)",
          body: "rgba(255,255,255,0.68)",
          pillBg: "rgba(255, 255, 255, 0.08)",
          star: "#f2cc60",
          fork: "#b392f0",
          shadow: "0 10px 26px rgba(2, 6, 23, 0.34)",
        };

  return (
    <article
      style={{
        border: `1px solid ${cardChrome.border}`,
        borderRadius: CARD.radius,
        padding: `${CARD.padY}px ${CARD.padX}px`,
        background: cardChrome.bg,
        color: cardChrome.title,
        minWidth: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        boxShadow: cardChrome.shadow,
      }}
    >
      <h4
        style={{
          fontSize: CARD.title,
          margin: 0,
          marginBottom: showDescription ? CARD.gapTitle : hasFooter ? CARD.gapTitle : 0,
          color: cardChrome.title,
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
            color: cardChrome.body,
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
            color: cardChrome.body,
            marginTop: showDescription ? CARD.gapFooter : CARD.gapTitle,
            alignItems: "center",
            lineHeight: 1.35,
          }}
        >
          {showLanguage && repo.language && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "2px 7px",
                borderRadius: 999,
                background: cardChrome.pillBg,
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
            <span style={{ whiteSpace: "nowrap", padding: "2px 7px", borderRadius: 999, background: cardChrome.pillBg }}>
              <span style={{ color: cardChrome.star }}>★</span> {repo.stargazers}
            </span>
          )}
          {showForks && (
            <span style={{ whiteSpace: "nowrap", padding: "2px 7px", borderRadius: 999, background: cardChrome.pillBg }}>
              <span style={{ color: cardChrome.fork }}>⑂</span> {repo.forks}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
