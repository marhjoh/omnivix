import { RepoNormalized } from "@/src/github/normalize";

interface RepoCardProps {
  repo: RepoNormalized;
  showDescription?: boolean;
  showLanguage?: boolean;
  showStars?: boolean;
  showForks?: boolean;
}

export function RepoCard({
  repo,
  showDescription = true,
  showLanguage = true,
  showStars = true,
  showForks = true,
}: RepoCardProps) {
  const hasFooter = showLanguage || showStars || showForks;

  return (
    <article
      style={{
        border: "1px solid rgba(255,255,255,0.16)",
        borderRadius: 12,
        padding: 14,
        background: "rgba(0,0,0,0.2)",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h4 style={{ fontSize: 18, marginBottom: showDescription ? 8 : hasFooter ? 8 : 0 }}>{repo.name}</h4>

      {showDescription && (
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.8)",
            marginBottom: hasFooter ? 10 : 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            flex: 1,
          }}
        >
          {repo.description ?? "No description"}
        </p>
      )}

      {hasFooter && (
        <div style={{ display: "flex", gap: 10, fontSize: 12, color: "rgba(255,255,255,0.78)", flexWrap: "wrap" }}>
          {showLanguage && repo.language && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {repo.languageColor && (
                <span
                  style={{
                    width: 8,
                    height: 8,
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
          {showStars && <span>★ {repo.stargazers}</span>}
          {showForks && <span>⑂ {repo.forks}</span>}
        </div>
      )}
    </article>
  );
}
