import { BACKGROUND_PRESETS } from "@/src/backgrounds/presets";
import { BACKGROUND_UPLOAD, MAX_IMAGE_FILE_BYTES } from "@/src/lib/imageUpload";
import { formatNames, uploadImageTypes } from "@/src/lib/imageSource";
import { BANNER_SIZES, exportFormats, exportPixelRatios, platformNames } from "@/src/lib/sizes";
import { listText, megabytes } from "@/src/lib/text";
import { DEFAULT_PIXEL_RATIO, EXPORT_PIXEL_RATIOS } from "@/src/export/format";
import { SITE_LICENSE, SITE_LINKS } from "@/src/lib/site";
import { HOUR_MS, MINUTE_MS, TTL_LONG, TTL_SHORT } from "@/src/github/cacheTimes";

// The landing page, the FAQPage JSON-LD and /llms.txt all use this text. Write each answer so it
// makes sense on its own, because search snippets and AI answers quote single passages.

function bannerFormatsSummary() {
  return Object.values(BANNER_SIZES)
    .map((f) => `${f.label} (${f.width} × ${f.height} px) for ${platformNames(f)}`)
    .join("; ");
}

/** "1×, 2× or 3×" */
function pixelRatiosSummary() {
  return listText(EXPORT_PIXEL_RATIOS.map((ratio) => `${ratio}×`));
}

/** "YouTube and Reddit": platforms whose banners are only exported at 1×. */
function oneTimesOnlyPlatforms() {
  const formats = Object.values(BANNER_SIZES).filter((format) =>
    exportFormats(format).every((file) => exportPixelRatios(format, file).length === 1),
  );
  return listText(
    formats.flatMap((format) => format.platforms.map((platform) => platform.name)),
    "and",
  );
}

const NUMBER_WORDS = "zero one two three four five six seven eight nine".split(" ");

/** Numbers under ten as words ("six"), for the FAQ's cache time. */
function inWords(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

export const HOW_IT_WORKS = [
  {
    word: "Pick.",
    title: "Pick a template",
    body: "Your GitHub profile, stats, repositories, tech stack, an intro with your links, a terminal-style summary, your AI coding usage, your certifications, contribution heatmap or a quote.",
  },
  {
    word: "Enter.",
    title: "Enter your GitHub username",
    body: "Omnivix reads your public GitHub data. No sign-in needed.",
  },
  {
    word: "Download.",
    title: "Customize and download",
    body: "Choose a background and layout, then download a PNG or JPEG.",
  },
] as const;

/** The FAQ's topics, in the order the landing page shows them. */
export const FAQ_TOPICS = ["About Omnivix", "Banners", "Your GitHub data"] as const;

export const FAQ = [
  {
    topic: "About Omnivix",
    question: "What is Omnivix?",
    answer:
      "Omnivix is a web app that creates profile banners for LinkedIn, X (Twitter), Bluesky, Twitch and more from your GitHub profile, repositories and contributions, or from a quote you choose.",
  },
  {
    topic: "About Omnivix",
    question: "Is Omnivix free?",
    answer: "Yes. Every template, size and download is free, with no watermark.",
  },
  {
    topic: "About Omnivix",
    question: "Do I need to sign in with GitHub?",
    answer:
      "No. Omnivix only needs your GitHub username. It never asks for your password or access to your account.",
  },
  {
    topic: "About Omnivix",
    question: "Is Omnivix open source?",
    answer: `Yes. Omnivix is open source under the ${SITE_LICENSE.name} license, and the code is on GitHub at ${SITE_LINKS.repo}.`,
  },
  {
    topic: "Banners",
    question: "Which banner sizes does Omnivix support?",
    answer: `${Object.keys(BANNER_SIZES).length} formats: ${bannerFormatsSummary()}.`,
  },
  {
    topic: "Banners",
    question: "What file formats and resolutions can I download?",
    answer: `PNG or JPEG, at ${pixelRatiosSummary()} resolution (${oneTimesOnlyPlatforms()}: 1×, as their banners are already large). 1× is the platform's exact size, and ${DEFAULT_PIXEL_RATIO}× (the default) stays sharp on high-resolution screens. JPEG files are much smaller, for platforms with upload limits.`,
  },
  {
    topic: "Banners",
    question: "Can I use my own background image?",
    answer: `Yes. Pick one of the ${BACKGROUND_PRESETS.length} built-in backgrounds, link to an https image, or upload your own ${formatNames(uploadImageTypes(BACKGROUND_UPLOAD))} image (up to ${megabytes(MAX_IMAGE_FILE_BYTES)}). Uploads are processed in your browser and only sent to the server while your banner is exported.`,
  },
  {
    topic: "Banners",
    question: "Can I add my company's logo?",
    answer:
      "Yes, on every banner. Link to an https image or upload one, including SVG, then drag it into place and pick its size. Like backgrounds, uploads stay in your browser until you export.",
  },
  {
    topic: "Your GitHub data",
    question: "What GitHub data does Omnivix use, and is it stored?",
    answer: `Only public data: your name, avatar, contributions, follower and pull request counts, public organizations, and repositories with their languages, stars and forks. GitHub data is cached briefly (up to ${inWords(TTL_LONG / HOUR_MS)} hours for past years' contributions), not saved to a database. To prevent abuse, Redis temporarily stores request counts linked to a hash of your IP address. Omnivix also counts visits and exports per day, without cookies and without storing who you are.`,
  },
  {
    topic: "Your GitHub data",
    question: "Why are some of my contributions missing?",
    answer: `Omnivix shows the same contributions as your GitHub profile. Private work only counts once you turn on “Include private contributions on my profile” at https://github.com/settings/profile. Commits from another account or service, an email address not linked to your account, or a non-default branch never count. New contributions can take up to ${TTL_SHORT / MINUTE_MS} minutes to show. More in GitHub's guide at https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions.`,
  },
  {
    topic: "Your GitHub data",
    question: "Why don't my organizations show?",
    answer: `Omnivix only shows organizations where your membership is public, and GitHub makes new memberships private. To change one, open the organization on GitHub, go to People and set your membership to Public. It can take ${TTL_SHORT / MINUTE_MS} minutes to show. More in GitHub's guide at https://docs.github.com/en/account-and-profile/how-tos/organization-membership/publicizing-or-hiding-organization-membership.`,
  },
] as const satisfies readonly {
  topic: (typeof FAQ_TOPICS)[number];
  question: string;
  answer: string;
}[];
