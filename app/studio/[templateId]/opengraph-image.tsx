import { notFound } from "next/navigation";
import { OG_CONTENT_TYPE, OG_SIZE, renderTemplateOgImage } from "@/src/og/ogImage";
import { templateRegistry } from "@/src/templates/registry";
import { SITE_NAME } from "@/src/lib/site";
import { TemplateId } from "@/src/types/template";

export const alt = `${SITE_NAME} banner template`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return Object.keys(templateRegistry).map((templateId) => ({ templateId }));
}

export default async function Image({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  if (!(templateId in templateRegistry)) {
    notFound();
  }
  const { meta } = templateRegistry[templateId as TemplateId];
  return renderTemplateOgImage(meta.id, meta.title, meta.description);
}
