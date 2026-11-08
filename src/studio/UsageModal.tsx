"use client";

import { Fragment, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { encodeAiUsage } from "@/src/banner/aiUsage";
import { CCUSAGE_COMMAND, readCcusage } from "@/src/banner/ccusage";
import { ThemedIcon } from "@/src/theme/ThemedBrand";
import { Dialog } from "@/src/ui/Dialog";

/**
 * Asks for pasted ccusage output, like UsernameModal asks for a username. Only the `usage` setting
 * it makes is kept, not the JSON.
 */
export function UsageModal({
  open,
  onSubmit,
  onCancel,
  onError,
}: {
  open: boolean;
  onSubmit: (usage: string) => void;
  onCancel: () => void;
  /** Shows a paste it can't read in a toast. */
  onError: (message: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  // Each time the dialog opens, the field starts empty.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft("");
      setCopied(false);
    }
  }
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function copyCommand() {
    // The command stays on screen to select by hand if the clipboard is blocked.
    navigator.clipboard.writeText(CCUSAGE_COMMAND).then(
      () => setCopied(true),
      () => {},
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = readCcusage(draft);
    if (result.ok) onSubmit(encodeAiUsage(result.usage));
    else onError(result.message);
  }

  return (
    <Dialog
      open={open}
      onCancel={onCancel}
      labelledBy="usage-modal-title"
      initialFocus={textareaRef}
    >
      <div className="mb-6 text-center">
        <ThemedIcon className="mx-auto mb-4 h-10 w-10" size={40} />
        <h2 id="usage-modal-title" className="text-lg font-bold">
          Add your AI usage
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-border px-3 py-2">
          <code className="min-w-0 flex-1 text-xs">
            {/* Wraps only between words, not at the dashes in --by-agent. */}
            {CCUSAGE_COMMAND.split(" ").map((word, i) => (
              <Fragment key={word}>
                {i > 0 && " "}
                <span className="whitespace-nowrap">{word}</span>
              </Fragment>
            ))}
          </code>
          <button
            type="button"
            onClick={copyCommand}
            aria-label={copied ? "Command copied" : "Copy command"}
            className="btn-ghost shrink-0 rounded p-1"
          >
            {copied ? (
              <Check className="h-4 w-4 text-accent" aria-hidden />
            ) : (
              <Copy className="h-4 w-4 text-muted" aria-hidden />
            )}
          </button>
        </div>

        <textarea
          ref={textareaRef}
          rows={6}
          spellCheck={false}
          placeholder="Paste the output here"
          aria-label="ccusage output"
          className="field-input mb-6 block resize-y font-mono text-xs"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            className="btn-primary h-10 w-full justify-center py-0"
            disabled={!draft.trim()}
          >
            Use usage
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary h-10 w-full justify-center py-0"
          >
            Cancel
          </button>
        </div>
      </form>
    </Dialog>
  );
}
