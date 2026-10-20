"use client";

import { useRouter } from "next/navigation";
import { getTemplates } from "@/src/templates/registry";
import type { TemplateId } from "@/src/types/template";

/** "GitHub Banner" → "GitHub", below md, where the header has no room for the full names. */
const shortTitle = (title: string) => title.replace(/ Banner$/, "");

/**
 * The studio header's title, as a native select: picking another template opens it in the
 * studio. Each template keeps its own saved settings (one cookie per template). Below md it's a
 * copy with short names; only one of the two is displayed (and in the accessibility tree).
 */
export function TemplateSwitcher({ templateId }: { templateId: TemplateId }) {
  const router = useRouter();
  const templates = getTemplates();
  // The wrapper clips a name too long for the narrowest phones (clipping the select itself
  // would also cut off its chevron), instead of letting it run under the buttons next to it.
  const picker = (short: boolean) => (
    <span className={`min-w-0 overflow-hidden ${short ? "flex md:hidden" : "hidden md:flex"}`}>
      <select
        aria-label="Template"
        value={templateId}
        onChange={(e) => router.push(`/studio/${e.target.value}`)}
        className="title-select"
      >
        {templates.map(({ meta }) => (
          <option key={meta.id} value={meta.id}>
            {short ? shortTitle(meta.title) : meta.title}
          </option>
        ))}
      </select>
    </span>
  );
  return (
    <>
      {picker(true)}
      {picker(false)}
    </>
  );
}
