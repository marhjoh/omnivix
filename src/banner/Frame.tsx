import { createContext, PropsWithChildren, useContext } from "react";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { backgroundImageStyle, type BannerBackground } from "@/src/banner/background";
import { PREVIEW_PHOTO_SIZES, previewPhotoSrcSet } from "@/src/backgrounds/presets";
import type { BannerLogo } from "@/src/banner/logo";
import { BANNER_LOGO_ATTRIBUTE, placementStyle } from "@/src/banner/placement";

/**
 * Set by the studio preview: a photo preset then loads one of its smaller copies, sized for the
 * preview. The export leaves it unset, so it always gets the full-size photo.
 */
export const PreviewPhotosContext = createContext(false);

/**
 * Banner root, identical in preview and export: the app theme's banner color and text color,
 * with the background image (if any) at 28% on top, then the content, then the logo (if any). The
 * studio preview draws its own ring and rounded corners around it (`.omnivix-artboard`) so they
 * stay crisp when the banner is scaled.
 */
export function Frame({
  children,
  background,
  logo,
  uiTheme,
}: PropsWithChildren<{
  background?: BannerBackground;
  logo?: BannerLogo;
  uiTheme: Theme;
}>) {
  const chrome = bannerUiChrome(uiTheme);
  const previewPhotos = useContext(PreviewPhotosContext);
  const srcSet = previewPhotos && background ? previewPhotoSrcSet(background.src) : undefined;
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
        // Keeps the export's colors in forced colors (Windows High Contrast).
        forcedColorAdjust: "none",
      }}
    >
      {background ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={background.src}
          srcSet={srcSet}
          sizes={srcSet ? PREVIEW_PHOTO_SIZES : undefined}
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
      {logo ? (
        // The padded box the logo moves in. Placed with CSS, so it's right from the server render.
        <div style={{ position: "absolute", inset: logo.inset, zIndex: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.src}
            alt=""
            {...{ [BANNER_LOGO_ATTRIBUTE]: "" }}
            style={{
              ...placementStyle(logo.position),
              height: logo.height,
              width: "auto",
              // A very wide wordmark is scaled down to half the box instead of stretched.
              maxWidth: "50%",
              objectFit: "contain",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
