import { BACKGROUND_PRESETS } from "@/src/backgrounds/presets";
import { MAX_BACKGROUND_UPLOAD_BYTES } from "@/src/lib/backgroundImageUpload";
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
    body: "Start from your GitHub profile, your repositories, your contribution heatmap or a quote.",
  },
  {
    title: "Enter your GitHub username",
    body: "Omnivix loads your public GitHub data. No sign-in needed, and the quote template needs no username at all.",
  },
  {
    title: "Customize and download",
    body: "Choose a background and layout, then download a sharp PNG sized for LinkedIn, X, Bluesky, Twitch and more.",
  },
] as const;

export const FAQ = [
  {
    question: "What is Omnivix?",
    answer:
      "Omnivix is a free web app that creates profile banners for LinkedIn, X (Twitter), Bluesky, Twitch and more from your GitHub profile, repositories and contributions, or from a quote you choose.",
  },
  {
    question: "Is Omnivix free?",
    answer: "Yes. Omnivix is free to use, with no account, sign-up or watermark.",
  },
  {
    question: "Is Omnivix open source?",
    answer: `Yes. Omnivix is open source under the ${SITE_LICENSE.name} license, and the code is on GitHub at ${SITE_LINKS.repo}.`,
  },
  {
    question: "Do I need to sign in with GitHub?",
    answer:
      "No. Omnivix only needs your GitHub username and reads public data through the GitHub API. It never asks for your password or access to your account.",
  },
  {
    question: "Which banner sizes does Omnivix support?",
    answer: `One format per aspect ratio: ${bannerFormatsSummary()}. Banners download as PNG at ${pixelRatiosSummary()} resolution: 1× is the platform's exact size, and ${EXPORT_PIXEL_RATIO}× (the default) stays sharp on high-resolution screens.`,
  },
  {
    question: "Can I use my own background image?",
    answer: `Yes. Pick one of the ${BACKGROUND_PRESETS.length} built-in backgrounds, link to an https image, or upload your own PNG, JPEG, WebP, AVIF or HEIC image (up to ${MAX_BACKGROUND_UPLOAD_BYTES / (1024 * 1024)} MB). Uploads are processed in your browser and only sent to the server while your banner is exported.`,
  },
  {
    question: "What GitHub data does Omnivix use, and is it stored?",
    answer:
      "Only public data: your name, avatar, contribution calendar and public repositories with their languages, stars and forks. It is kept in server memory for a few minutes (up to six hours for past years' contributions) to stay within GitHub's rate limits, and never saved to a database.",
  },
  {
    question: "Why are some of my contributions missing?",
    answer:
      "Omnivix shows the same contributions as your GitHub profile. Private repositories count once you turn on “Include private contributions on my profile” at https://github.com/settings/profile, and only the counts are shown. Work on a separate account, GitLab, GitHub Enterprise Server, an unlinked email address or a non-default branch never counts. Changes can take up to 3 minutes to show. More at https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions.",
  },
] as const;
