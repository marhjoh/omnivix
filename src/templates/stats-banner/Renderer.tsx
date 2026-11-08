import type { CSSProperties } from "react";
import {
  BookMarked,
  Building2,
  CalendarDays,
  Flame,
  GitPullRequest,
  Star,
  Trophy,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cardStyle, FORK_COLOR, LanguageDot, STAR_COLOR } from "@/src/banner/card";
import { ProfileBanner } from "@/src/banner/ProfileBlock";
import {
  contributionStreaks,
  formatCount,
  starsReceived,
  topLanguages,
  type LanguageShare,
} from "@/src/banner/stats";
import { bannerUiChrome, type BannerUiChrome } from "@/src/theme/theme";
import type { OrganizationNormalized } from "@/src/github/types";
import type { RendererProps } from "@/src/templates/types";

const TILE_COLUMN_PX = 124;
const GAP_PX = 8;
const CARD_PADDING = "10px 12px";
/** GitHub's gray for languages without a color, used for "Other" too. */
const NO_LANGUAGE_COLOR = "#8b949e";

/** The repos banner's star and fork colors, and a few more in the same tone. */
const ICON_COLORS = {
  blue: "#58a6ff",
  yellow: STAR_COLOR,
  purple: FORK_COLOR,
  green: "#3fb950",
  orange: "#ff7b45",
};

type IconColor = keyof typeof ICON_COLORS;

interface Tile {
  label: string;
  icon: LucideIcon;
  color: IconColor;
  value: number;
  unit?: string;
}

function days(count: number) {
  return count === 1 ? "day" : "days";
}

export function StatsBannerRenderer({ state, data, uiTheme }: RendererProps<"stats-banner">) {
  const chrome = bannerUiChrome(uiTheme);
  const { user, contributions, repos = [], organizations = [] } = data;
  const streaks = contributions ? contributionStreaks(contributions) : { current: 0, longest: 0 };

  const tiles = (
    [
      [
        state.showRepoCount,
        { label: "Repos", icon: BookMarked, color: "blue", value: user?.publicRepos ?? 0 },
      ],
      [
        state.showStarCount,
        { label: "Stars", icon: Star, color: "yellow", value: starsReceived(repos) },
      ],
      [
        state.showFollowerCount,
        { label: "Followers", icon: Users, color: "purple", value: user?.followers ?? 0 },
      ],
      [
        state.showFollowingCount,
        { label: "Following", icon: UserPlus, color: "purple", value: user?.following ?? 0 },
      ],
      [
        state.showPullRequestCount,
        {
          label: "Pull requests",
          icon: GitPullRequest,
          color: "green",
          value: user?.pullRequests ?? 0,
        },
      ],
      [
        state.showContributionCount,
        {
          label: "Contributions",
          icon: CalendarDays,
          color: "green",
          value: contributions?.total ?? 0,
        },
      ],
      [
        state.showCurrentStreak,
        {
          label: "Current streak",
          icon: Flame,
          color: "orange",
          value: streaks.current,
          unit: days(streaks.current),
        },
      ],
      [
        state.showLongestStreak,
        {
          label: "Longest streak",
          icon: Trophy,
          color: "yellow",
          value: streaks.longest,
          unit: days(streaks.longest),
        },
      ],
    ] satisfies [boolean, Tile][]
  ).flatMap(([shown, tile]) => (shown ? [tile] : []));

  const languages = state.showLanguages ? topLanguages(repos) : [];
  // Every banner size is wide, so up to six tiles share one row. Seven or eight make two rows.
  const columns = tiles.length <= 6 ? tiles.length : Math.ceil(tiles.length / 2);
  const card: CSSProperties = { ...cardStyle(chrome), padding: CARD_PADDING };
  // Zero width with a full min-width: a wide card wraps at the tiles' width instead of widening
  // the banner content.
  const fullWidthCard: CSSProperties = {
    ...card,
    width: tiles.length ? 0 : undefined,
    minWidth: "100%",
  };
  const iconColor = (color: IconColor) => (state.showIconColors ? ICON_COLORS[color] : undefined);

  return (
    <ProfileBanner state={state} user={user} chrome={chrome}>
      <div style={{ display: "flex", flexDirection: "column", gap: GAP_PX }}>
        {tiles.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${columns}, ${TILE_COLUMN_PX}px)`,
              gap: GAP_PX,
            }}
          >
            {tiles.map((tile) => (
              <StatTile
                key={tile.label}
                tile={tile}
                iconColor={iconColor(tile.color)}
                chrome={chrome}
                style={card}
              />
            ))}
          </div>
        )}
        {languages.length > 0 && (
          <LanguageBar languages={languages} chrome={chrome} style={fullWidthCard} />
        )}
        {state.showOrganizations && organizations.length > 0 && (
          <OrganizationsCard
            organizations={organizations}
            iconColor={iconColor("blue")}
            chrome={chrome}
            style={fullWidthCard}
          />
        )}
      </div>
    </ProfileBanner>
  );
}

function StatTile({
  tile: { label, icon: Icon, value, unit },
  iconColor,
  chrome,
  style,
}: {
  tile: Tile;
  iconColor: string | undefined;
  chrome: BannerUiChrome;
  style: CSSProperties;
}) {
  return (
    <div style={style}>
      <CardLabel icon={Icon} label={label} iconColor={iconColor} chrome={chrome} />
      <p
        style={{
          margin: "5px 0 0",
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatCount(value)}
        {unit && (
          <span
            style={{ marginLeft: 4, fontSize: 12, fontWeight: 500, color: chrome.cardTextMuted }}
          >
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

/** A card's icon and muted label. */
function CardLabel({
  icon: Icon,
  label,
  iconColor,
  chrome,
}: {
  icon: LucideIcon;
  label: string;
  /** Without one, the icon takes the label's muted color. */
  iconColor: string | undefined;
  chrome: BannerUiChrome;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        lineHeight: 1.2,
        color: chrome.cardTextMuted,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={12} strokeWidth={2.25} aria-hidden color={iconColor} />
      {label}
    </div>
  );
}

function OrganizationsCard({
  organizations,
  iconColor,
  chrome,
  style,
}: {
  organizations: OrganizationNormalized[];
  iconColor: string | undefined;
  chrome: BannerUiChrome;
  style: CSSProperties;
}) {
  return (
    <div style={style}>
      <CardLabel icon={Building2} label="Organizations" iconColor={iconColor} chrome={chrome} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        {organizations.map((organization) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={organization.login}
            src={organization.avatarUrl}
            alt=""
            style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0 }}
          />
        ))}
      </div>
    </div>
  );
}

function LanguageBar({
  languages,
  chrome,
  style,
}: {
  languages: LanguageShare[];
  chrome: BannerUiChrome;
  style: CSSProperties;
}) {
  return (
    <div style={style}>
      <div style={{ display: "flex", gap: 2, height: 8, borderRadius: 999, overflow: "hidden" }}>
        {languages.map((language) => (
          <span
            key={language.name}
            style={{ flex: language.share, background: language.color ?? NO_LANGUAGE_COLOR }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 12px",
          marginTop: 8,
          fontSize: 11,
          lineHeight: 1.35,
        }}
      >
        {languages.map((language) => (
          <span
            key={language.name}
            style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
          >
            <LanguageDot color={language.color ?? NO_LANGUAGE_COLOR} />
            {language.name}
            <span style={{ color: chrome.cardTextMuted }}>{Math.round(language.share * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
