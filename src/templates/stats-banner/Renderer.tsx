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
import { cardStyle } from "@/src/banner/card";
import { CardLabel, ICON_COLORS, ShareBar, StatTile, type IconColor } from "@/src/banner/statCards";
import { ProfileBanner } from "@/src/banner/ProfileBlock";
import { contributionStreaks, formatCount, starsReceived, topLanguages } from "@/src/banner/stats";
import { bannerUiChrome, type BannerUiChrome } from "@/src/theme/theme";
import type { OrganizationNormalized } from "@/src/github/types";
import type { RendererProps } from "@/src/templates/types";

const TILE_COLUMN_PX = 124;
const GAP_PX = 8;
const CARD_PADDING = "10px 12px";

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
            {tiles.map(({ color, value, ...tile }) => (
              <StatTile
                key={tile.label}
                {...tile}
                value={formatCount(value)}
                iconColor={iconColor(color)}
                chrome={chrome}
                style={card}
              />
            ))}
          </div>
        )}
        {languages.length > 0 && (
          <ShareBar shares={languages} chrome={chrome} style={fullWidthCard} />
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
