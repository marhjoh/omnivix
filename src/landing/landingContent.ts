import { BACKGROUND_PRESETS } from "@/src/backgrounds/presets";
import { BANNER_SIZES } from "@/src/lib/sizes";
import { EXPORT_PIXEL_RATIO } from "@/src/export/viewport";
import { SITE_LICENSE } from "@/src/lib/site";
import { SITE_LINKS } from "@/src/lib/site-links";

// Single source for the landing page's "How it works" and FAQ, the FAQPage JSON-LD and /llms.txt.
// Keep each answer self-contained: AI answers and search snippets quote single passages.

const { linkedinCover, xHeader } = BANNER_SIZES;

function px(size: { width: number; height: number }) {
  return `${size.width} × ${size.height} px`;
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
    title: "Customise and download",
    body: "Choose a background and layout, then download a sharp PNG sized for your LinkedIn cover or X header.",
  },
] as const;

export const FAQ = [
  {
    question: "What is Omnivix?",
    answer:
      "Omnivix is a free web app that creates LinkedIn cover images and X (Twitter) header images from your GitHub profile, repositories and contributions, or from a quote you choose.",
  },
  {
    question: "Is Omnivix free?",
    answer: "Yes. Omnivix is free to use, with no account, sign-up or watermark.",
  },
  {
    question: "Is Omnivix open source?",
    answer: `Yes. Omnivix is open source under the ${SITE_LICENSE.name} licence, and the code is on GitHub at ${SITE_LINKS.repo}.`,
  },
  {
    question: "Do I need to sign in with GitHub?",
    answer:
      "No. Omnivix only needs your GitHub username and reads public data through the GitHub API. It never asks for your password or access to your account.",
  },
  {
    question: "Which banner sizes does Omnivix support?",
    answer: `LinkedIn cover image (${px(linkedinCover)}) and X header (${px(xHeader)}). Banners download as PNG at ${EXPORT_PIXEL_RATIO}× resolution, for example ${linkedinCover.width * EXPORT_PIXEL_RATIO} × ${linkedinCover.height * EXPORT_PIXEL_RATIO} px for LinkedIn, so they stay sharp on high-resolution screens.`,
  },
  {
    question: "What GitHub data does Omnivix use, and is it stored?",
    answer:
      "Only public data: your name, avatar, contribution calendar and public repositories with their languages, stars and forks. It is kept in server memory for a few minutes (up to six hours for past years' contributions) to stay within GitHub's rate limits, and never saved to a database.",
  },
  {
    question: "Why are some of my contributions missing?",
    answer:
      "Omnivix shows the same contributions as your GitHub profile. Contributions to private repositories on github.com count once you turn on “Include private contributions on my profile” at https://github.com/settings/profile, and only the counts are shown, never repository names or code. Some work never counts, and no setting changes that: commits on a separate work account, on GitLab or GitHub Enterprise Server, made with an email address that isn't linked to your GitHub account, or not on the repository's default branch. This year's contributions are cached for 3 minutes, so a change can take up to 3 minutes to show. GitHub explains the rules at https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions.",
  },
  {
    question: "Can I use my own background image?",
    answer: `Yes. Pick one of the ${BACKGROUND_PRESETS.length} built-in backgrounds or upload your own PNG, JPEG, WebP or HEIC image. Uploads are processed in your browser and only sent to the server while your banner is exported.`,
  },
] as const;
