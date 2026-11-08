import { useMemo, type CSSProperties } from "react";
import {
  Bot,
  CalendarDays,
  CalendarRange,
  CircleDollarSign,
  Coins,
  Flame,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { activeDays, decodeAiUsage, usageCalendar, type UsageShare } from "@/src/banner/aiUsage";
import { cardStyle } from "@/src/banner/card";
import { ContributionGrid, contributionGridStyle } from "@/src/banner/ContributionGrid";
import { contentFit } from "@/src/banner/contentPosition";
import { FitContent } from "@/src/banner/FitContent";
import {
  CardLabel,
  ICON_COLORS,
  ShareBar,
  StatTile,
  type IconColor,
  type Share,
} from "@/src/banner/statCards";
import { contributionStreaks, formatCount } from "@/src/banner/stats";
import { bannerUiChrome } from "@/src/theme/theme";
import type { RendererProps } from "@/src/templates/types";

/** Sizes before FitContent scales them. */
const SIZING = {
  gap: 8,
  cardPadding: "10px 12px",
  tileMinWidth: 124,
  /** The models and agents column beside the heatmap. */
  sideWidth: 260,
  grid: { cell: 11, gap: 3 },
};

/** After the grid colors' brand color. "Other" is gray. */
const SHARE_COLORS = [ICON_COLORS.purple, ICON_COLORS.yellow, "#56d4dd", "#f778ba"];

const MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

interface Tile {
  label: string;
  icon: LucideIcon;
  color: IconColor;
  value: string;
  unit?: string;
}

function days(count: number) {
  return count === 1 ? "day" : "days";
}

function withColors(shares: UsageShare[], brand: string): Share[] {
  const colors = [brand, ...SHARE_COLORS];
  let next = 0;
  return shares.map(({ name, percent }) => ({
    name,
    share: percent / 100,
    color: name === "Other" ? null : colors[next++],
  }));
}

export function AiUsageBannerRenderer({ state, uiTheme }: RendererProps<"ai-usage-banner">) {
  const chrome = bannerUiChrome(uiTheme);
  // Dragging the background re-renders the banner often. The grid only lays out the days again when
  // it gets a new calendar.
  const usage = useMemo(() => decodeAiUsage(state.usage), [state.usage]);
  const calendar = useMemo(() => usage && usageCalendar(usage), [usage]);
  if (!usage || !calendar) return null;

  const streaks = contributionStreaks(calendar);
  const gridStyle = contributionGridStyle(state);
  const active = activeDays(usage);
  const tiles = (
    [
      [
        state.showTokenCount,
        { label: "Tokens", icon: Coins, color: "blue", value: formatCount(usage.tokens) },
      ],
      [
        state.showCost && usage.cost !== null,
        {
          label: "Cost",
          icon: CircleDollarSign,
          color: "green",
          value: `$${formatCount(usage.cost ?? 0)}`,
        },
      ],
      [
        state.showActiveDays,
        {
          label: "Active days",
          icon: CalendarDays,
          color: "purple",
          value: formatCount(active),
        },
      ],
      [
        state.showCurrentStreak,
        {
          label: "Current streak",
          icon: Flame,
          color: "orange",
          value: formatCount(streaks.current),
          unit: days(streaks.current),
        },
      ],
      [
        state.showLongestStreak,
        {
          label: "Longest streak",
          icon: Trophy,
          color: "yellow",
          value: formatCount(streaks.longest),
          unit: days(streaks.longest),
        },
      ],
    ] satisfies [boolean, Tile][]
  ).flatMap(([shown, tile]) => (shown ? [tile] : []));

  // The grid's brand color leads the bars, so they match it.
  const brand = gridStyle.colors.gridLevels[3];
  const models = state.showModels ? withColors(usage.models, brand) : [];
  const agents = state.showAgents ? withColors(usage.agents, brand) : [];
  const card: CSSProperties = { ...cardStyle(chrome), padding: SIZING.cardPadding };
  const iconColor = (color: IconColor) => (state.showIconColors ? ICON_COLORS[color] : undefined);
  const range = `${MONTH_YEAR.format(new Date(calendar.weeks[0].firstDay))} – ${MONTH_YEAR.format(new Date(usage.end))}`;

  const shareCards = [
    { label: "Models", icon: Sparkles, color: "purple", shares: models },
    { label: "Agents", icon: Bot, color: "blue", shares: agents },
  ] satisfies Array<{ label: string; icon: LucideIcon; color: IconColor; shares: Share[] }>;
  const shownShareCards = shareCards.filter(({ shares }) => shares.length > 0);

  return (
    <FitContent {...contentFit(state)} size={state.contentSize}>
      <div style={{ display: "flex", flexDirection: "column", gap: SIZING.gap }}>
        {tiles.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${tiles.length}, minmax(${SIZING.tileMinWidth}px, 1fr))`,
              gap: SIZING.gap,
            }}
          >
            {tiles.map(({ color, ...tile }) => (
              <StatTile
                key={tile.label}
                {...tile}
                iconColor={iconColor(color)}
                chrome={chrome}
                style={card}
              />
            ))}
          </div>
        )}
        {(state.showHeatmap || shownShareCards.length > 0) && (
          <div style={{ display: "flex", gap: SIZING.gap }}>
            {state.showHeatmap && (
              // Fills the row when a short range makes the grid narrower than the tiles above.
              <div style={{ ...card, flex: "1 1 auto", display: "flex", flexDirection: "column" }}>
                <CardLabel
                  icon={CalendarRange}
                  label={range}
                  iconColor={iconColor("green")}
                  chrome={chrome}
                />
                {/* Centered when the card is larger than the grid. */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 6,
                    color: chrome.cardTextMuted,
                  }}
                >
                  <ContributionGrid
                    contributions={calendar}
                    {...gridStyle}
                    cellSize={SIZING.grid.cell}
                    gap={SIZING.grid.gap}
                    showMonthLabels
                  />
                </div>
              </div>
            )}
            {shownShareCards.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: SIZING.gap,
                  // Beside the heatmap it's a fixed column. On its own it takes the full width.
                  flex: state.showHeatmap ? `0 0 ${SIZING.sideWidth}px` : "1 1 auto",
                }}
              >
                {shownShareCards.map(({ label, icon, color, shares }) => (
                  <ShareBar
                    key={label}
                    shares={shares}
                    chrome={chrome}
                    style={{ ...card, flex: 1 }}
                  >
                    <CardLabel
                      icon={icon}
                      label={label}
                      iconColor={iconColor(color)}
                      chrome={chrome}
                    />
                  </ShareBar>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </FitContent>
  );
}
