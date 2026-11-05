import type { MetadataRoute } from "next";
import { getSiteUrl, studioPath } from "@/src/lib/site";
import { TEMPLATE_IDS } from "@/src/templates/types";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  return [
    { url: siteUrl.toString(), changeFrequency: "monthly", priority: 1 },
    ...TEMPLATE_IDS.map((templateId) => ({
      url: new URL(studioPath(templateId), siteUrl).toString(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
