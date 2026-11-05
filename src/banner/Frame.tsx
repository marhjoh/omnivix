import { createContext, PropsWithChildren, useContext } from "react";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { backgroundImageStyle, type BannerBackground } from "@/src/banner/background";
import { previewPhotoSrcSet } from "@/src/backgrounds/presets";
import { PREVIEW_PHOTO_SIZES } from "@/src/studio/layout";
import type { BannerLogo } from "@/src/banner/logo";
import {
  BANNER_BACKGROUND_ATTRIBUTE,
  BANNER_LOGO_ATTRIBUTE,
  BANNER_ROOT_CLASS,
  placementStyle,
} from "@/src/banner/placement";

/**
 * True in the studio preview, where photo presets load a smaller copy. The export leaves it false
 * and always gets the full-size photo.
 */
export const PreviewPhotosContext = createContext(false);

/**
 * The banner's root, the same in the preview and the export. It stacks the background image, the
 * content and the logo. The preview draws its ring and rounded corners outside it
 * (`.omnivix-artboard`) so they stay crisp when the banner is scaled.
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
      className={BANNER_ROOT_CLASS}
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        background: chrome.baseBg,
        color: chrome.text,
        // Keep the banner's own colors in Windows High Contrast mode.
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
          {...{ [BANNER_BACKGROUND_ATTRIBUTE]: "" }}
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
        // The padded box the logo moves in. Plain CSS places it, so the server render is right.
        <div style={{ position: "absolute", ...logo.box, zIndex: 2 }}>
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
