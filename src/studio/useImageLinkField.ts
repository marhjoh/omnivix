import { type RefObject, useEffect, useRef, useState } from "react";
import { isHttpsUrl } from "@/src/lib/imageSource";
import { useImageStatus } from "@/src/studio/useImageStatus";
import { useDebouncedCallback } from "@/src/ui/useDebouncedCallback";

/** How long the link field must be idle before a link that can't be used is reported. */
const LINK_SETTLE_MS = 1000;

/** The link field starts with this, fixed: the export only loads https images. */
export const HTTPS = "https://";

/** What the link field holds after its fixed "https://": a pasted link loses its scheme. */
function withoutScheme(link: string): string {
  return link.replace(/^\s*https?:\/\//i, "");
}

/**
 * The image picker's link field (ImagePicker): what's typed, the link once the user stops typing,
 * and the toast for a link that can't be loaded. A typed link becomes the image only once the
 * browser has loaded it (or failed to), so the banner keeps its image while the user types.
 */
export function useImageLinkField({
  value,
  onChange,
  onError,
  onErrorResolved,
  inputRef,
}: {
  /** The image setting's value: a link, a preset, an upload or none. */
  value: string | undefined;
  onChange: (next: string | undefined) => void;
  onError: (message: string) => number;
  onErrorResolved: (toastId: number) => void;
  /** The link field, focused when it opens. */
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  /** What's typed after "https://"; `undefined` shows the current link (`value`) instead. */
  const [draft, setDraft] = useState<string | undefined>(undefined);
  /** The link once the user stops typing (idle, Enter or leaving the field); only it's reported. */
  const [settledLink, setSettledLink] = useState<string | undefined>(undefined);
  /** The link a toast is showing for, so each link is reported once and its toast can be hidden. */
  const reportedRef = useRef<{ link: string; toastId: number } | null>(null);

  /** The current image when it's a link. */
  const linkValue = typeof value === "string" && isHttpsUrl(value) ? value.trim() : undefined;
  const linkStatus = useImageStatus(linkValue);
  // A link the browser can't load is left out of the preview (see useBannerImage) and reported
  // once the user has stopped typing it.
  const linkProblem =
    settledLink && settledLink === linkValue && linkStatus === "failed"
      ? "Couldn't load this image link."
      : null;

  // A settled link that isn't the image yet. It becomes the image once the browser has loaded it
  // or it has failed; until then the banner keeps the image it has, so typing never makes it
  // flicker.
  const pendingLink = settledLink && settledLink !== linkValue ? settledLink : undefined;
  const pendingStatus = useImageStatus(pendingLink);
  useEffect(() => {
    if (pendingLink && (pendingStatus === "loaded" || pendingStatus === "failed")) {
      onChange(pendingLink);
    }
  }, [pendingLink, pendingStatus, onChange]);

  useEffect(() => {
    const reported = reportedRef.current;
    // The reported link was changed, or works now: its toast is out of date.
    if (reported && (reported.link !== settledLink || !linkProblem)) {
      onErrorResolved(reported.toastId);
      reportedRef.current = null;
    }
    if (linkProblem && settledLink && !reportedRef.current) {
      reportedRef.current = { link: settledLink, toastId: onError(linkProblem) };
    }
  }, [linkProblem, settledLink, onError, onErrorResolved]);

  useEffect(() => {
    if (editorOpen && inputRef.current) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [editorOpen, inputRef]);

  /**
   * The user has stopped typing: a link is checked, and an emptied field removes the image if that
   * was a link. A preset or upload stays when the field is opened and left empty.
   */
  const settle = (text: string) => {
    // Cleaned again once settled: a pasted "https:// x" or "https://https://x" still works.
    const rest = withoutScheme(text.trim());
    const link = rest ? HTTPS + rest : "";
    setSettledLink(link);
    if (!link && linkValue) onChange(undefined);
  };

  const debouncedSettle = useDebouncedCallback(settle, LINK_SETTLE_MS);

  /**
   * Enter or leaving the field: check the link now, without waiting for the pause. Leaving never
   * closes the field (switching windows to copy a link would); another choice in the menu does.
   */
  const settleNow = () => {
    if (draft === undefined) return;
    debouncedSettle.cancel();
    settle(draft);
  };

  return {
    /** The current image when it's a link. */
    linkValue,
    /** The field shows while it's being edited, and whenever the image is a link. */
    shown: editorOpen || linkValue !== undefined,
    /** For PrefixedInput, after the fixed `HTTPS`. */
    inputProps: {
      value: draft ?? (linkValue ? withoutScheme(linkValue) : ""),
      onChange: (raw: string) => {
        const next = withoutScheme(raw);
        setDraft(next);
        debouncedSettle.schedule(next);
      },
      onBlur: settleNow,
      onEnter: settleNow,
      /**
       * The × button: the link and the image go, but the field stays open, ready for another link.
       * Choosing something else in the menu closes it.
       */
      onClear: () => {
        debouncedSettle.cancel();
        setDraft("");
        setSettledLink(undefined);
        onChange(undefined);
      },
    },
    /** "Image from URL" was chosen: the field opens with the current link, or empty. */
    open: () => {
      setEditorOpen(true);
      if (linkValue) {
        setDraft(undefined);
        return;
      }
      // Start over with an empty field.
      setDraft("");
      setSettledLink(undefined);
    },
    /** Something else was chosen in the menu: the field closes, and what was typed is dropped. */
    close: () => {
      debouncedSettle.cancel();
      setSettledLink(undefined);
      setDraft(undefined);
      setEditorOpen(false);
    },
  };
}
