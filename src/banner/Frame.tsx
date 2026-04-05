import { CSSProperties, PropsWithChildren } from "react";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";

export function Frame({
  children,
  backgroundImage,
  style,
  isExport = false,
  appTheme = "dark",
}: PropsWithChildren<{
  backgroundImage?: string;
  style?: CSSProperties;
  isExport?: boolean;
  /** App light/dark: frame border/fallback match preview + export. */
  appTheme?: Theme;
}>) {
  const chrome = bannerUiChrome(appTheme);
  return (
    <div
      className="banner-export-root"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: isExport ? 0 : 12,
        border: isExport ? "none" : `1px solid ${chrome.frameBorder}`,
        overflow: "hidden",
        position: "relative",
        background: chrome.frameFallback,
        ...style,
      }}
    >
      {backgroundImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundImage}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.28,
          }}
        />
      ) : null}
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>{children}</div>
    </div>
  );
}
