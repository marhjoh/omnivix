import type { ReactNode } from "react";
import type { GithubUserNormalized } from "@/src/github/types";
import { usernameOf } from "@/src/lib/githubUsername";
import { FitContent } from "@/src/banner/FitContent";
import { contentFit } from "@/src/banner/contentPosition";
import { normalizeContentSize } from "@/src/banner/contentSize";
import { ELLIPSIS } from "@/src/banner/textStyle";
import type { BannerUiChrome } from "@/src/theme/theme";

/** Natural sizes; `FitContent` scales the profile together with the rest of the banner. */
const SIZING = { avatar: 28, name: 13, handle: 12 };

/**
 * The GitHub and repos banners' content: avatar, name and @handle as the banner's state shows
 * them, above `children`, placed and scaled to the Content size setting.
 */
export function ProfileBanner({
  state,
  user,
  chrome,
  children,
}: {
  state: Record<string, unknown>;
  user: GithubUserNormalized | undefined;
  chrome: BannerUiChrome;
  children: ReactNode;
}) {
  const right = state.profilePosition === "right";
  const login = user?.login ?? usernameOf(state);
  const displayName = state.showDisplayName === true ? user?.name?.trim() : undefined;

  return (
    <FitContent {...contentFit(state)} size={normalizeContentSize(state.contentSize)}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: right ? "flex-end" : "flex-start" }}>
          <div style={{ display: "flex", gap: displayName ? 8 : 6, alignItems: "center" }}>
            {state.showAvatar !== false && user?.avatarUrl ? (
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
