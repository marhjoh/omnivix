import { BACKGROUND_PRESETS } from "@/src/backgrounds/presets";
import { MAX_IMAGE_FILE_BYTES } from "@/src/lib/imageUpload";
import { BANNER_SIZES } from "@/src/lib/sizes";
import { EXPORT_PIXEL_RATIO, EXPORT_PIXEL_RATIOS } from "@/src/export/viewport";
import { SITE_LICENSE } from "@/src/lib/site";
import { SITE_LINKS } from "@/src/lib/site-links";

// Single source for the landing page's "How it works" and FAQ, the FAQPage JSON-LD and /llms.txt.
// Keep each answer self-contained: AI answers and search snippets quote single passages.

function bannerFormatsSummary() {
  return Object.values(BANNER_SIZES)
    .map(
      (f) =>
        `${f.label} (${f.width} × ${f.height} px) for ${f.platforms.map((p) => p.name).join(", ")}`,
    )
    .join("; ");
}

/** "1×, 2× or 3×" */
function pixelRatiosSummary() {
  const ratios = EXPORT_PIXEL_RATIOS.map((ratio) => `${ratio}×`);
  return `${ratios.slice(0, -1).join(", ")} or ${ratios.at(-1)}`;
}

export const HOW_IT_WORKS = [
  {
    title: "Pick a template",
    body: "Your GitHub profile, repositories, contribution heatmap or a quote.",
  },
  {
    title: "Enter your GitHub username",
    body: "Omnivix reads your public GitHub data. No sign-in needed.",
  },
  {
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
    answer: `One format per aspect ratio: ${bannerFormatsSummary()}.`,
  },
  {
    topic: "Banners",
    question: "What file formats and resolutions can I download?",
    answer: `PNG or JPEG, at ${pixelRatiosSummary()} resolution. 1× is the platform's exact size, and ${EXPORT_PIXEL_RATIO}× (the default) stays sharp on high-resolution screens. On YouTube, 3× is JPEG only: a 3× PNG can go over YouTube's 6 MB limit. JPEG files are much smaller, for platforms with upload limits.`,
  },
  {
    topic: "Banners",
    question: "Can I use my own background image?",
    answer: `Yes. Pick one of the ${BACKGROUND_PRESETS.length} built-in backgrounds, link to an https image, or upload your own PNG, JPEG, WebP, AVIF or HEIC image (up to ${MAX_IMAGE_FILE_BYTES / (1024 * 1024)} MB). Uploads are processed in your browser and only sent to the server while your banner is exported.`,
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
    answer:
      "Only public data: your name, avatar, contribution calendar and public repositories with their languages, stars and forks. It is kept in server memory for a few minutes (up to six hours for past years' contributions) to stay within GitHub's rate limits, and never saved to a database.",
  },
  {
    topic: "Your GitHub data",
    question: "Why are some of my contributions missing?",
    answer:
      "Omnivix shows the same contributions as your GitHub profile. Private work only counts once you turn on “Include private contributions on my profile” at https://github.com/settings/profile. Commits from another account or service, an email address not linked to your account, or a non-default branch never count. New contributions can take up to 3 minutes to show. More in GitHub's guide at https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions.",
  },
] as const satisfies readonly {
  topic: (typeof FAQ_TOPICS)[number];
  question: string;
  answer: string;
}[];
