import { SITE_LINKS } from "@/src/lib/site-links";
import { getSiteUrl, SITE_DESCRIPTION, SITE_LICENSE, SITE_NAME } from "@/src/lib/site";
import { BANNER_SIZES } from "@/src/lib/sizes";
import { getTemplates } from "@/src/templates/registry";
import { FAQ } from "@/src/landing/landingContent";

/** schema.org JSON-LD for the landing page: the site, the app, its source code and its FAQ. */
export function landingJsonLd() {
  const siteUrl = getSiteUrl();
  const url = siteUrl.toString();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        url,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name: SITE_NAME,
        url,
        description: SITE_DESCRIPTION,
        applicationCategory: "DesignApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        license: SITE_LICENSE.url,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        image: new URL("/opengraph-image", siteUrl).toString(),
        featureList: [
          ...getTemplates().map(({ meta }) => `${meta.title}: ${meta.description}`),
          ...Object.values(BANNER_SIZES).map(
            (s) => `${s.label} banner (${s.width} × ${s.height} px)`,
          ),
        ],
        creator: { "@type": "Person", name: "marhjoh", url: SITE_LINKS.maintainerProfile },
        sameAs: [SITE_LINKS.repo],
      },
      {
        "@type": "SoftwareSourceCode",
        "@id": `${url}#source`,
        name: SITE_NAME,
        codeRepository: SITE_LINKS.repo,
        license: SITE_LICENSE.url,
        programmingLanguage: "TypeScript",
        targetProduct: { "@id": `${url}#app` },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: FAQ.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };
}
