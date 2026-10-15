import { PropsWithChildren } from "react";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { backgroundImageStyle, type BannerBackground } from "@/src/banner/background";

/**
 * Banner root, identical in preview and export: the app theme's banner color and text color,
 * with the background image (if any) at 28% on top. The studio preview draws its own ring and
 * rounded corners around it (`.omnivix-artboard`) so they stay crisp when the banner is scaled.
 */
export function Frame({
  children,
  background,
  uiTheme,
}: PropsWithChildren<{
  background?: BannerBackground;
  uiTheme: Theme;
}>) {
  const chrome = bannerUiChrome(uiTheme);
  return (
    <div
      className="banner-export-root"
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        background: chrome.baseBg,
        color: chrome.text,
      }}
    >
      {background ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={background.src}
          alt=""
          data-banner-background=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.28,
            ...backgroundImageStyle(background),
          }}
        />
      ) : null}
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
        {children}
      </div>
    </div>
  );
}
