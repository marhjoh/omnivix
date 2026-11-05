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
  // Username is global; avoid stale per-template copies.
  if (needsUsername) delete clone.username;
  // Presets and https links are kept, with what belongs to them. Uploads are too large.
  removeUnsavableImages(clone);
  const json = JSON.stringify(clone);
  if (fitsInCookie(json)) return json;
  // A very long link is left out rather than losing every setting to the cookie size limit.
  for (const key of Object.keys(IMAGE_SETTINGS)) removeImage(clone, key);
  return JSON.stringify(clone);
}

/**
 * The banner's settings: the template's defaults with the saved ones and a studio link applied,
 * saved again as they change.
 */
export function useBannerSettings({
  templateId,
  start: serverStart,
  link,
}: {
  templateId: TemplateId;
  /** What the server rendered from: the saved settings with the link applied. */
  start: StartingSettings;
  link: LinkSettings | null;
}) {
  const needsUsername = templateRegistry[templateId].meta.needsUsername;

  // Saved settings come from cookies, so the server renders them and nothing switches after load.
  // The browser reads the cookies again when the studio is opened by navigating (Back, Forward, a
  // link): Next.js may reuse the page from an earlier visit then, with props holding older settings.
  const [start] = useState(() =>
    typeof document === "undefined"
      ? serverStart
      : startingSettings(templateId, readCookieClient, link),
  );
  const [state, setState] = useState<Record<string, unknown>>(start.state);
  // The link is applied once: drop it from the address bar, so a reload keeps later changes
  // (saved in cookies like any other).
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

  // On the left, center or right line, the alignment follows.
  const moveContent = useCallback((position: Position) => {
    setState((prev) => ({
      ...prev,
      contentPosition: position,
      alignment: alignmentAt(position.x) ?? prev.alignment,
    }));
  }, []);

  const username = usernameOf(state);

  // Saved as cookies, and only when the saved part changes (not on every background drag).
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
