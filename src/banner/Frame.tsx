import { createContext, PropsWithChildren, useContext } from "react";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { backgroundImageStyle, type BannerBackground } from "@/src/banner/background";
import { PREVIEW_PHOTO_SIZES, previewPhotoSrcSet } from "@/src/backgrounds/presets";

/**
 * Set by the studio preview: a photo preset then loads one of its smaller copies, sized for the
 * preview. The export leaves it unset, so it always gets the full-size photo.
 */
export const PreviewPhotosContext = createContext(false);

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
    </div>
  );
}
