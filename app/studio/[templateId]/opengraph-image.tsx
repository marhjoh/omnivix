import { notFound } from "next/navigation";
import { OG_CONTENT_TYPE, OG_SIZE, renderTemplateOgImage } from "@/src/og/ogImage";
import { isTemplateId, templateRegistry } from "@/src/templates/registry";
import { SITE_NAME } from "@/src/lib/site";

export const alt = `${SITE_NAME} banner template`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return Object.keys(templateRegistry).map((templateId) => ({ templateId }));
}

export default async function Image({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  if (!isTemplateId(templateId)) {
    notFound();
  }
  const { meta } = templateRegistry[templateId];
  return renderTemplateOgImage(meta.id, meta.title, meta.description);
}
