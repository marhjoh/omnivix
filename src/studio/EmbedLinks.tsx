import { Code, FileText, Link, type LucideIcon } from "lucide-react";
import type { ExportFormat, ExportPixelRatio } from "@/src/export/format";
import { bannerImageUrl, linkQuery } from "@/src/studio/embedUrl";
import { templateRegistry } from "@/src/templates/registry";
import type { TemplateId } from "@/src/templates/types";
import type { Theme } from "@/src/theme/theme";
import controls from "@/src/studio/controls.module.css";

const SNIPPETS: ReadonlyArray<{
  name: string;
  Icon: LucideIcon;
  write: (url: string, alt: string) => string;
}> = [
  { name: "Link", Icon: Link, write: (url) => url },
  { name: "Markdown", Icon: FileText, write: (url, alt) => `![${alt}](${url})` },
  {
    name: "HTML",
    Icon: Code,
    write: (url, alt) => `<img src="${url.replaceAll("&", "&amp;")}" alt="${alt}">`,
  },
];

/**
 * The export panel's embed rows: the banner's image URL, copied as a link, Markdown or HTML. The
 * URL follows the panel's resolution and format.
 */
export function EmbedLinks({
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
  /** Disabled like the Image button while there's nothing to export. */
  disabled: boolean;
  /** `name` goes in the confirmation, e.g. "Markdown copied." */
  onCopy: (text: string, name: string) => void;
}) {
  const query = linkQuery(templateId, state);
  const url = query
    ? bannerImageUrl(window.location.origin, templateId, query, { format, pixelRatio, uiTheme })
    : null;
  const { title, needsUsername } = templateRegistry[templateId].meta;
  const alt = needsUsername ? `${title} by @${state.username}` : title;

  return (
    <>
      {url === null && (
        <p className="px-2 pb-1 text-xs text-muted">
          Uploaded images can&apos;t go in a link. Use a built-in background or an image link.
        </p>
      )}
      {SNIPPETS.map(({ name, Icon, write }) => (
        <button
          key={name}
          type="button"
          disabled={disabled || url === null}
          onClick={() => url && onCopy(write(url, alt), name)}
          className={controls.panelAction}
        >
          <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          {name}
        </button>
      ))}
    </>
  );
}
