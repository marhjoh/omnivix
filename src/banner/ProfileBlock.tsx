import type { ReactNode } from "react";
import type { GithubUserNormalized } from "@/src/github/types";
import { FitContent } from "@/src/banner/FitContent";
import { contentFit } from "@/src/banner/contentPosition";
import type { ContentSize } from "@/src/banner/contentSize";
import type { BaseSettings, ProfileSettings } from "@/src/templates/stateSchemas";
import { ELLIPSIS } from "@/src/banner/textStyle";
import type { BannerUiChrome } from "@/src/theme/theme";

/** Sizes before scaling. FitContent scales the profile with the rest of the content. */
const SIZING = { avatar: 28, name: 13, handle: 12 };

/** Content for the GitHub and repos banners: the avatar, name and @handle above `children`. */
export function ProfileBanner({
  state,
  user,
  chrome,
  children,
}: {
  state: BaseSettings & ProfileSettings & { contentSize: ContentSize };
  user: GithubUserNormalized | undefined;
  chrome: BannerUiChrome;
  children: ReactNode;
}) {
  const right = state.profilePosition === "right";
  const login = user?.login ?? state.username;
  const displayName = state.showDisplayName ? user?.name?.trim() : undefined;

  return (
    <FitContent {...contentFit(state)} size={state.contentSize}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: right ? "flex-end" : "flex-start" }}>
          <div style={{ display: "flex", gap: displayName ? 8 : 6, alignItems: "center" }}>
            {state.showAvatar && user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                style={{
                  width: SIZING.avatar,
                  height: SIZING.avatar,
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              />
            ) : null}
            <div style={{ textAlign: right ? "right" : "left" }}>
              {displayName ? (
                <>
                  <p
                    style={{
                      margin: "0 0 2px",
                      fontSize: SIZING.name,
                      fontWeight: 700,
                      lineHeight: 1.15,
                      letterSpacing: "-0.02em",
                      ...ELLIPSIS,
                    }}
                  >
                    {displayName}
                  </p>
                  <p style={{ margin: 0, fontSize: SIZING.handle, color: chrome.textMuted }}>
                    @{login}
                  </p>
                </>
              ) : (
                <p
                  style={{
                    margin: 0,
                    fontSize: SIZING.handle,
                    fontWeight: 600,
                    lineHeight: 1.2,
                    letterSpacing: "-0.02em",
                  }}
                >
                  @{login}
                </p>
              )}
            </div>
          </div>
        </div>
        {children}
      </div>
    </FitContent>
  );
}
