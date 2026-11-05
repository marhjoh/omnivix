import { useId, useState } from "react";
import { Code, Copy } from "lucide-react";
import type { ExportFormat, ExportPixelRatio } from "@/src/export/format";
import { DropdownChevron } from "@/src/ui/Dropdown";
import { TileGroup } from "@/src/studio/TileGroup";
import { bannerImageUrl, linkQuery } from "@/src/studio/embedUrl";
import { templateRegistry } from "@/src/templates/registry";
import type { TemplateId } from "@/src/templates/types";
import type { Theme } from "@/src/theme/theme";
import controls from "@/src/studio/controls.module.css";

type SnippetKind = "link" | "markdown" | "html";

const SNIPPETS: ReadonlyArray<{
  value: SnippetKind;
  label: string;
  write: (url: string, alt: string) => string;
}> = [
  { value: "link", label: "Link", write: (url) => url },
  { value: "markdown", label: "Markdown", write: (url, alt) => `![${alt}](${url})` },
  {
    value: "html",
    label: "HTML",
    write: (url, alt) => `<img src="${url.replaceAll("&", "&amp;")}" alt="${alt}">`,
  },
];

/**
 * "Embed in a README or site" in the export panel. Opens to show the banner's image URL as a
 * link, Markdown or HTML, with the current settings and the panel's resolution and format.
 */
export function EmbedDisclosure({
  templateId,
  state,
  uiTheme,
  format,
  pixelRatio,
  disabled,
  onCopy,
}: {
  templateId: TemplateId;
  state: Record<string, unknown>;
  uiTheme: Theme;
  format: ExportFormat;
  pixelRatio: ExportPixelRatio;
  /** Disabled like Copy image while there's nothing to export. */
  disabled: boolean;
  /** `name` goes in the confirmation, e.g. "Markdown copied." */
  onCopy: (text: string, name: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [kind, setKind] = useState<SnippetKind>("markdown");
  const bodyId = useId();
  const open = expanded && !disabled;
  const query = linkQuery(templateId, state);
  const { title, needsUsername } = templateRegistry[templateId].meta;
  const alt = needsUsername ? `${title} by @${state.username}` : title;
  const { label: name, write } = SNIPPETS.find((snippet) => snippet.value === kind)!;
  const snippet = query
    ? write(
        bannerImageUrl(window.location.origin, templateId, query, { format, pixelRatio, uiTheme }),
        alt,
      )
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(!open)}
        disabled={disabled}
        aria-expanded={open}
        aria-controls={bodyId}
        className={controls.panelAction}
      >
        <Code className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        Embed in a README or site
        <DropdownChevron open={open} className="ml-auto text-muted" />
      </button>
      {/* Kept in the DOM when closed so the height can animate. */}
      <div id={bodyId} className={controls.embedBody} data-open={open}>
        {/* Padding goes inside the clipping element, or focus rings get cut off. */}
        <div>
          <div className="grid gap-2 px-2 pt-1 pb-2">
            {snippet === null ? (
              <p className="text-xs text-muted">
                Uploaded images can&apos;t go in a link. Use a built-in background or an image link.
              </p>
            ) : (
              <>
                <TileGroup
                  label="Embed as"
                  labelClassName="sr-only"
                  columns={3}
                  tileClassName={controls.viewTile}
                  options={SNIPPETS}
                  value={kind}
                  onChange={setKind}
                >
                  {(option) => option.label}
                </TileGroup>
                <div className="field-input flex items-center py-0 pr-1">
                  <input
                    type="text"
                    readOnly
                    value={snippet}
                    aria-label={name}
                    spellCheck={false}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-w-0 flex-1 bg-transparent py-[9px] font-mono text-xs leading-5 outline-none"
                  />
                  <button
                    type="button"
                    aria-label={`Copy ${name}`}
                    onClick={() => onCopy(snippet, name)}
                    className="btn-ghost h-8 w-8 shrink-0 p-0"
                  >
                    <Copy className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
