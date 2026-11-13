import { notFound } from "next/navigation";
import { OG_CONTENT_TYPE, OG_SIZE, renderTemplateOgImage } from "@/src/og/ogImage";
import { isTemplateId, templateRegistry } from "@/src/templates/registry";
import { SITE_NAME } from "@/src/lib/site";

export function generateStaticParams() {
  return Object.keys(templateRegistry).map((templateId) => ({ templateId }));
}

// Gives each template its own alt text, which an `alt` export can't.
// https://nextjs.org/docs/app/api-reference/functions/generate-image-metadata
export function generateImageMetadata({ params }: { params: { templateId: string } }) {
  if (!isTemplateId(params.templateId)) return [];
  const { title } = templateRegistry[params.templateId].meta;
  return [
    { id: "og", alt: `${title} on ${SITE_NAME}`, size: OG_SIZE, contentType: OG_CONTENT_TYPE },
  ];
}

export default async function Image({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  if (!isTemplateId(templateId)) {
    notFound();
  }
  return renderTemplateOgImage(templateId);
}
