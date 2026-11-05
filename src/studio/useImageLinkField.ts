import { type RefObject, useEffect, useRef, useState } from "react";
import { isHttpsUrl } from "@/src/lib/imageSource";
import { useImageStatus } from "@/src/studio/useImageStatus";
import { useDebouncedCallback } from "@/src/ui/useDebouncedCallback";

/** How long typing must pause before the link is checked. */
const LINK_SETTLE_MS = 1000;

/** Fixed prefix of the link field. The export only loads https images. */
export const HTTPS = "https://";

/** Strips the scheme from a pasted link, since the field already shows "https://". */
function withoutScheme(link: string): string {
  return link.replace(/^\s*https?:\/\//i, "");
}

/**
 * State for the link field in ImagePicker. A typed link only becomes the image once the browser has
 * loaded it (or failed to), so the banner keeps its current image while the user types. A link
 * that fails to load is reported in a toast.
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
  /** Text after "https://". `undefined` shows the current link instead. */
  const [draft, setDraft] = useState<string | undefined>(undefined);
  /** The link once typing stops, on Enter, or on leaving the field. Only this one is reported. */
  const [settledLink, setSettledLink] = useState<string | undefined>(undefined);
  /** The link with an open error toast, so it's reported once and the toast can be closed. */
  const reportedRef = useRef<{ link: string; toastId: number } | null>(null);

  const linkValue = typeof value === "string" && isHttpsUrl(value) ? value.trim() : undefined;
  const linkStatus = useImageStatus(linkValue);
  // The preview leaves out a link the browser can't load (see useBannerImage). It's reported once
  // the user stops typing.
  const linkProblem =
    settledLink && settledLink === linkValue && linkStatus === "failed"
      ? "Couldn't load this image link."
      : null;

  // A settled link that isn't the image yet.
  const pendingLink = settledLink && settledLink !== linkValue ? settledLink : undefined;
  const pendingStatus = useImageStatus(pendingLink);
  useEffect(() => {
    if (pendingLink && (pendingStatus === "loaded" || pendingStatus === "failed")) {
      onChange(pendingLink);
    }
  }, [pendingLink, pendingStatus, onChange]);

  useEffect(() => {
    const reported = reportedRef.current;
    // The reported link changed or works now, so its toast is out of date.
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
   * Runs when the user stops typing. Checks the link, or removes the image if the field was emptied
   * and the image was a link. A preset or upload stays if the field is opened and left empty.
   */
  const settle = (text: string) => {
    // Clean it again so a pasted "https:// x" or "https://https://x" still works.
    const rest = withoutScheme(text.trim());
    const link = rest ? HTTPS + rest : "";
    setSettledLink(link);
    if (!link && linkValue) onChange(undefined);
  };

  const debouncedSettle = useDebouncedCallback(settle, LINK_SETTLE_MS);

  /**
   * On Enter or leaving the field, check the link right away. Leaving doesn't close the field,
   * because switching windows to copy a link would close it. Another choice in the menu does.
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
      /** The × button. Removes the link and image but keeps the field open for another link. */
      onClear: () => {
        debouncedSettle.cancel();
        setDraft("");
        setSettledLink(undefined);
        onChange(undefined);
      },
    },
    /** For "Image from URL": opens the field with the current link, or empty. */
    open: () => {
      setEditorOpen(true);
      if (linkValue) {
        setDraft(undefined);
        return;
      }
      setDraft("");
      setSettledLink(undefined);
    },
    /** For another menu choice: closes the field and drops what was typed. */
    close: () => {
      debouncedSettle.cancel();
      setSettledLink(undefined);
      setDraft(undefined);
      setEditorOpen(false);
    },
  };
}
