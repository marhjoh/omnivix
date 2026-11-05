import {
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_LICENSE,
  SITE_NAME,
  SITE_LINKS,
  studioPath,
} from "@/src/lib/site";
import { getTemplates } from "@/src/templates/registry";
import { FAQ, HOW_IT_WORKS } from "@/src/landing/landingContent";
import { exportApiDocs } from "@/src/export/apiDocs";

// A Markdown summary of the site for AI assistants (https://llmstxt.org).
export const dynamic = "force-static";

export function GET() {
  const siteUrl = getSiteUrl();
  const link = (path: string) => new URL(path, siteUrl).toString();

  const body = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "## Templates",
    "",
    ...getTemplates().map(
      ({ meta }) => `- [${meta.title}](${link(studioPath(meta.id))}): ${meta.description}`,
    ),
    "",
    "## How it works",
    "",
    ...HOW_IT_WORKS.map((step, i) => `${i + 1}. ${step.title}: ${step.body}`),
    "",
    "## FAQ",
    "",
    ...FAQ.flatMap(({ question, answer }) => [`### ${question}`, "", answer, ""]),
    ...exportApiDocs(siteUrl),
    "## Links",
    "",
    `- [Source code](${SITE_LINKS.repo}) (${SITE_LICENSE.name} license)`,
    `- [Maintainer](${SITE_LINKS.maintainerProfile})`,
    "",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
