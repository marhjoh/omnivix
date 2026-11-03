import type { ReactNode } from "react";
import type { GithubUserNormalized } from "@/src/github/normalize";
import { usernameOf } from "@/src/lib/githubUsername";
import type { bannerUiChrome } from "@/src/theme/theme";

/** Natural sizes; `FitContent` scales the profile together with the rest of the banner. */
const SIZING = { avatar: 28, name: 13, handle: 12 };

/** The GitHub and repos banners' content: the profile as the banner's state shows it, above `children`. */
export function ProfileColumn({
  state,
  user,
  chrome,
  children,
}: {
  state: Record<string, unknown>;
  user: GithubUserNormalized | undefined;
  chrome: ReturnType<typeof bannerUiChrome>;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <ProfileBlock
        user={user}
        username={usernameOf(state)}
        chrome={chrome}
        showAvatar={state.showAvatar !== false}
        showDisplayName={state.showDisplayName === true}
        right={state.profilePosition === "right"}
      />
      {children}
    </div>
  );
}

/** Avatar, name and @handle. */
function ProfileBlock({
  user,
  username,
  chrome,
  showAvatar,
  showDisplayName,
  right,
}: {
  user: GithubUserNormalized | undefined;
  username: string;
  chrome: ReturnType<typeof bannerUiChrome>;
  showAvatar: boolean;
  showDisplayName: boolean;
  /** Profile position: on the right edge of the content instead of the left. */
  right: boolean;
}) {
  const login = user?.login ?? username;
  const displayName = showDisplayName ? user?.name?.trim() : undefined;

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        minWidth: 0,
        justifyContent: right ? "flex-end" : "flex-start",
      }}
    >
      <div style={{ display: "flex", gap: displayName ? 8 : 6, alignItems: "center" }}>
        {showAvatar && user?.avatarUrl ? (
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
        <div style={{ minWidth: 0, textAlign: right ? "right" : "left" }}>
          {displayName ? (
            <>
              <p
                style={{
                  margin: "0 0 2px",
                  fontSize: SIZING.name,
                  fontWeight: 700,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
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
  );
}
