import { CSSProperties, PropsWithChildren } from "react";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";

/**
 * Banner root, identical in preview and export. The studio preview draws its own ring and
 * rounded corners around it (`.omnivix-artboard`) so they stay crisp when the banner is scaled.
 */
export function Frame({
  children,
  backgroundImage,
  style,
  appTheme = "dark",
}: PropsWithChildren<{
  backgroundImage?: string;
  style?: CSSProperties;
  /** App light/dark: fallback background matches preview + export. */
  appTheme?: Theme;
}>) {
  const chrome = bannerUiChrome(appTheme);
  return (
    <div
      className="banner-export-root"
      style={{
        width: "100%",
        height: "100%",
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
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
        {children}
      </div>
    </div>
  );
}
