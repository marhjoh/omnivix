import { createContext, PropsWithChildren, type SyntheticEvent, useContext } from "react";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { backgroundImageStyle, type BannerBackground } from "@/src/banner/background";
import { previewPhotoSrcSet } from "@/src/backgrounds/presets";
import { PREVIEW_PHOTO_SIZES } from "@/src/studio/layout";
import type { BannerLogo } from "@/src/banner/logo";
import type { Rect } from "@/src/lib/sizes";
import type { BannerCredit } from "@/src/banner/credit";
import { CreditMark } from "@/src/banner/CreditMark";
import {
  BANNER_BACKGROUND_ATTRIBUTE,
  BANNER_CREDIT_ATTRIBUTE,
  BANNER_LOGO_ATTRIBUTE,
  BANNER_ROOT_CLASS,
  placementStyle,
} from "@/src/banner/placement";

/**
 * True in the studio preview, where photo presets load a smaller copy. The export leaves it false
 * and always gets the full-size photo.
 */
export const PreviewPhotosContext = createContext(false);

function markLoadedBackground(img: HTMLImageElement | null) {
  if (img?.complete) img.dataset.loadedEarly = "";
}

function fadeInLateBackground(event: SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  if (!("loadedEarly" in img.dataset)) img.dataset.fadeIn = "";
}

/** The padded box an item moves in. Plain CSS places the item, so the server render is right. */
function PaddedBox({ box, zIndex, children }: PropsWithChildren<{ box: Rect; zIndex: number }>) {
  return <div style={{ position: "absolute", ...box, zIndex }}>{children}</div>;
}

/**
 * The banner's root, the same in the preview and the export. It stacks the background image, the
 * content, the logo and the credit. The preview draws its ring and rounded corners outside it
 * (`.omnivix-artboard`) so they stay crisp when the banner is scaled.
 */
export function Frame({
  children,
  background,
  logo,
  credit,
  uiTheme,
  transparent,
}: PropsWithChildren<{
  background?: BannerBackground;
  logo?: BannerLogo;
  credit?: BannerCredit;
  uiTheme: Theme;
  /** Leaves out the theme's color. */
  transparent: boolean;
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
        background: transparent ? undefined : chrome.baseBg,
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
          // In the studio, a background that arrives after the banner fades in (studio.module.css).
          // One that's already loaded when the banner appears shows right away.
          ref={previewPhotos ? markLoadedBackground : undefined}
          onLoad={previewPhotos ? fadeInLateBackground : undefined}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            ...backgroundImageStyle(background),
          }}
        />
      ) : null}
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
        {children}
      </div>
      {logo ? (
        <PaddedBox box={logo.box} zIndex={2}>
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
        </PaddedBox>
      ) : null}
      {credit ? (
        <PaddedBox box={credit.box} zIndex={3}>
          <div
            {...{ [BANNER_CREDIT_ATTRIBUTE]: "" }}
            style={{ ...placementStyle(credit.position), width: "max-content" }}
          >
            <CreditMark credit={credit} uiTheme={uiTheme} />
          </div>
        </PaddedBox>
      ) : null}
    </div>
  );
}
