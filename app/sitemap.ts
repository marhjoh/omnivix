import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/src/lib/site";
import { templateRegistry } from "@/src/templates/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  return [
    { url: siteUrl.toString(), changeFrequency: "monthly", priority: 1 },
    ...Object.keys(templateRegistry).map((templateId) => ({
      url: new URL(`/studio/${templateId}`, siteUrl).toString(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
