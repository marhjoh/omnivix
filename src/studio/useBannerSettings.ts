import { useCallback, useEffect, useMemo, useState } from "react";
import { alignmentAt } from "@/src/banner/contentPosition";
import type { Position } from "@/src/banner/position";
import { fitsInCookie, readCookieClient, setCookieClient } from "@/src/lib/cookies";
import { usernameOf } from "@/src/lib/githubUsername";
import { sizeOfPlatform } from "@/src/lib/sizes";
import {
  type LinkSettings,
  type StartingSettings,
  startingSettings,
} from "@/src/studio/linkSettings";
import {
  clampSelectedRepos,
  IMAGE_SETTINGS,
  removeImage,
  removeImageSettings,
  removeUnsavableImages,
} from "@/src/studio/savedSettings";
import { settingsCookie, USERNAME_COOKIE } from "@/src/studio/studioCookies";
import { templateRegistry } from "@/src/templates/registry";
import type { TemplateId } from "@/src/templates/types";

/** The part of the state that's saved per template, as JSON. */
function storedStateJson(state: Record<string, unknown>, needsUsername: boolean): string {
  const clone = { ...state };
  // The username is saved once for all templates.
  if (needsUsername) delete clone.username;
  // Keep presets and https links with their settings. Uploads are too large for a cookie.
  removeUnsavableImages(clone);
  const json = JSON.stringify(clone);
  if (fitsInCookie(json)) return json;
  // If a very long link doesn't fit, drop it instead of losing every setting.
  for (const key of Object.keys(IMAGE_SETTINGS)) removeImage(clone, key);
  return JSON.stringify(clone);
}

/**
 * The banner's settings. They start from the template defaults with the saved settings and the
 * link applied, and changes are saved to cookies.
 */
export function useBannerSettings({
  templateId,
  start: serverStart,
  link,
}: {
  templateId: TemplateId;
  /** The settings the server rendered with. */
  start: StartingSettings;
  link: LinkSettings | null;
}) {
  const needsUsername = templateRegistry[templateId].meta.needsUsername;

  // Settings live in cookies so the server can render them and nothing changes after load. The
  // browser still reads the cookies again. On Back, Forward or a link, Next.js may reuse the page
  // from an earlier visit, and its props then hold older settings.
  const [start] = useState(() =>
    typeof document === "undefined"
      ? serverStart
      : startingSettings(templateId, readCookieClient, link),
  );
  const [state, setState] = useState<Record<string, unknown>>(start.state);
  // Apply the link once, then remove it from the address bar. Otherwise a reload would apply it
  // again over the user's later changes.
  useEffect(() => {
    if (link) window.history.replaceState(null, "", window.location.pathname);
  }, [link]);

  const updateState = useCallback(
    (key: string, value: unknown) => {
      setState((prev) => {
        // A platform comes with its format.
        const size = key === "platform" ? (sizeOfPlatform(value) ?? prev.size) : prev.size;
        const next = clampSelectedRepos(templateId, { ...prev, size, [key]: value });
        // A new image drops the old one's settings, such as a background's position.
        removeImageSettings(next, key);
        // Picking an alignment puts the content at that spot, centered vertically.
        if (key === "alignment") delete next.contentPosition;
        return next;
      });
    },
    [templateId],
  );

  // Dropping the content on the left, center or right line also sets the alignment.
  const moveContent = useCallback((position: Position) => {
    setState((prev) => ({
      ...prev,
      contentPosition: position,
      alignment: alignmentAt(position.x) ?? prev.alignment,
    }));
  }, []);

  const username = usernameOf(state);

  // Write the cookie only when the saved part changes, not on every background drag.
  const storedJson = useMemo(() => storedStateJson(state, needsUsername), [state, needsUsername]);
  useEffect(() => {
    setCookieClient(settingsCookie(templateId).name, storedJson);
  }, [templateId, storedJson]);
  useEffect(() => {
    if (needsUsername && username) setCookieClient(USERNAME_COOKIE.name, username);
  }, [needsUsername, username]);

  return {
    state,
    username,
    updateState,
    moveContent,
    /** No username was saved or linked, so the studio asks for one. */
    missingSavedUsername: needsUsername && !start.username,
  };
}
