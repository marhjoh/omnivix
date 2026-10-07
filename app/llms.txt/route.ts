import { getSiteUrl, SITE_DESCRIPTION, SITE_LICENSE, SITE_NAME } from "@/src/lib/site";
import { SITE_LINKS } from "@/src/lib/site-links";
import { getTemplates } from "@/src/templates/registry";
import { FAQ, HOW_IT_WORKS } from "@/src/landing/landingContent";

// https://llmstxt.org: a Markdown summary of the site for AI assistants.
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
      ({ meta }) => `- [${meta.title}](${link(`/studio/${meta.id}`)}): ${meta.description}`,
    ),
    "",
    "## How it works",
    "",
    ...HOW_IT_WORKS.map((step, i) => `${i + 1}. ${step.title}: ${step.body}`),
    "",
    "## FAQ",
    "",
    ...FAQ.flatMap(({ question, answer }) => [`### ${question}`, "", answer, ""]),
    "## Links",
    "",
    `- [Source code](${SITE_LINKS.repo}) (${SITE_LICENSE.name} licence)`,
    `- [Maintainer](${SITE_LINKS.maintainerProfile})`,
    "",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
