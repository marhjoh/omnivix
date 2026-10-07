import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/src/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /render is only for the export API's headless browser.
      disallow: ["/render/", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", getSiteUrl()).toString(),
  };
}
