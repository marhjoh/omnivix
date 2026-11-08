import type { CSSProperties, ReactNode } from "react";
import { cardStyle } from "@/src/banner/card";
import { contentFit } from "@/src/banner/contentPosition";
import { FitContent } from "@/src/banner/FitContent";
import { colorValue, fontFamily, PALETTE } from "@/src/banner/quoteStyle";
import { terminalRows } from "@/src/banner/terminal";
import { bannerUiChrome, type BannerUiChrome, type Theme } from "@/src/theme/theme";
import type { RendererProps } from "@/src/templates/types";

/** Sizes before FitContent scales them. */
const SIZING = {
  avatar: 136,
  text: 14,
  gap: 28,
  colorBlock: { width: 22, height: 14 },
  windowDot: 10,
};

/** The usual terminal colors, in ANSI order. The last block is the text color. */
const COLOR_BLOCKS = ["gray", "red", "green", "amber", "blue", "fuchsia", "cyan"] as const;

/** macOS window buttons: close, minimize and zoom. */
const WINDOW_DOTS = ["#ff5f57", "#febc2e", "#28c840"];

export function TerminalBannerRenderer({ state, data, uiTheme }: RendererProps<"terminal-banner">) {
  const chrome = bannerUiChrome(uiTheme);
  const login = data.user?.login ?? state.username;
  const avatarUrl = state.showAvatar ? data.user?.avatarUrl : undefined;
  const keyColor = colorValue(state.keyColor, uiTheme) ?? chrome.text;
  const rows = terminalRows(state, data);
  const header = `${login}@github`;

  const output = (
    <div style={{ display: "flex", alignItems: "flex-start", gap: SIZING.gap }}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          style={{
            width: SIZING.avatar,
            height: SIZING.avatar,
            borderRadius: 12,
            flexShrink: 0,
          }}
        />
      ) : null}
      <div style={{ whiteSpace: "pre" }}>
        <div style={{ fontWeight: 700 }}>
          <span style={{ color: keyColor }}>{login}</span>@
          <span style={{ color: keyColor }}>github</span>
        </div>
        <div>{"-".repeat(header.length)}</div>
        {rows.map(({ label, value }) => (
          <div key={label}>
            <span style={{ color: keyColor, fontWeight: 700 }}>{label}</span>: {value}
          </div>
        ))}
        {state.showColorBlocks && <ColorBlocks uiTheme={uiTheme} chrome={chrome} />}
      </div>
    </div>
  );

  return (
    <FitContent {...contentFit(state)} size={state.contentSize}>
      <div
        style={{
          fontFamily: fontFamily("jetbrains-mono"),
          fontSize: SIZING.text,
          lineHeight: 1.6,
          fontVariantLigatures: "none",
        }}
      >
        {state.showWindow ? <Window chrome={chrome}>{output}</Window> : output}
      </div>
    </FitContent>
  );
}

function Window({ chrome, children }: { chrome: BannerUiChrome; children: ReactNode }) {
  const dot: CSSProperties = {
    width: SIZING.windowDot,
    height: SIZING.windowDot,
    borderRadius: "50%",
  };
  return (
    <div style={{ ...cardStyle(chrome), padding: "12px 24px 20px 16px" }}>
      <div style={{ display: "flex", gap: 7, marginBottom: 16 }}>
        {WINDOW_DOTS.map((color) => (
          <span key={color} style={{ ...dot, background: color }} />
        ))}
      </div>
      <div style={{ paddingLeft: 8 }}>{children}</div>
    </div>
  );
}

function ColorBlocks({ uiTheme, chrome }: { uiTheme: Theme; chrome: BannerUiChrome }) {
  const colors = [...COLOR_BLOCKS.map((color) => PALETTE[color][uiTheme]), chrome.text];
  return (
    <div style={{ display: "flex", marginTop: 12 }}>
      {colors.map((color) => (
        <span key={color} style={{ ...SIZING.colorBlock, background: color }} />
      ))}
    </div>
  );
}
