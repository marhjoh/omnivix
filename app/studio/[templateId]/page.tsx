import { notFound } from "next/navigation";
import { templateRegistry } from "@/src/templates/registry";
import { StudioShell } from "@/src/studio/StudioShell";
import { TemplateId } from "@/src/types/template";

export default async function StudioPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  if (!(templateId in templateRegistry)) {
    notFound();
  }
  return <StudioShell templateId={templateId as TemplateId} />;
}
