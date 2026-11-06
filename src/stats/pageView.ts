import "server-only";
import { userAgent, type NextRequest } from "next/server";
import { TEMPLATE_IDS } from "@/src/templates/types";
import { isOneOf } from "@/src/lib/isOneOf";
import { countStats, visitorId } from "@/src/stats/stats";
import { SERIES } from "@/src/stats/statFields";

const STUDIO_PATH = /^\/studio\/([a-z-]+)$/;

/** Shared links can name their source, like `?ref=reddit`. */
const SOURCE_PARAMS = ["ref", "utm_source"];

const MAX_SOURCE_LENGTH = 60;

/** Browser names come from the User-Agent, which anyone can set. */
const MAX_NAME_LENGTH = 30;

/**
 * Counts a visit to the landing page or a studio page, without cookies. Only full page loads count:
 * moving between pages inside the app doesn't load a document.
 */
export function countPageView(request: NextRequest): void {
  const page = pageOf(request.nextUrl.pathname);
  if (!page || !isPageLoad(request) || isAutomated(request)) return;
  countStats(pageViewFields(request, page), {
    id: visitorId(request),
    steps: page === "/" ? ["site"] : ["site", "studio"],
  });
}

function pageOf(path: string): string | null {
  if (path === "/") return "/";
  const templateId = STUDIO_PATH.exec(path)?.[1];
  return isOneOf(TEMPLATE_IDS, templateId) ? `/studio/${templateId}` : null;
}

/**
 * Bots, headless browsers like Vercel's deployment screenshots, Lighthouse runs, and AI agents that
 * sign their requests (https://datatracker.ietf.org/doc/draft-meunier-web-bot-auth-architecture/).
 */
function isAutomated(request: NextRequest): boolean {
  const agent = userAgent(request);
  return (
    agent.isBot || /Headless|Lighthouse/.test(agent.ua) || request.headers.has("signature-agent")
  );
}

/** Browsers send these on a navigation. Prefetches and most bots don't. */
function isPageLoad(request: NextRequest): boolean {
  return (
    request.headers.get("sec-fetch-dest") === "document" &&
    request.headers.get("sec-fetch-mode") === "navigate"
  );
}

function pageViewFields(request: NextRequest, page: string): string[] {
  const country = request.headers.get("x-vercel-ip-country") ?? "";
  const { device, browser } = userAgent(request);
  return [
    SERIES.views,
    `${SERIES.page}:${page}`,
    `${SERIES.referrer}:${sourceOf(request)}`,
    `${SERIES.country}:${/^[A-Z]{2}$/.test(country) ? country : "unknown"}`,
    `${SERIES.device}:${device.type === "mobile" || device.type === "tablet" ? device.type : "desktop"}`,
    `${SERIES.browser}:${cleanName(browser.name)}`,
  ];
}

function cleanName(name: string | undefined): string {
  return (
    name
      ?.replace(/[^\w .-]/g, "")
      .trim()
      .slice(0, MAX_NAME_LENGTH) || "unknown"
  );
}

function cleanParam(value: string | null): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, MAX_SOURCE_LENGTH);
}

/** A `?ref=` in the link, else the referring site. Links from Omnivix itself count as direct. */
function sourceOf(request: NextRequest): string {
  for (const param of SOURCE_PARAMS) {
    const value = cleanParam(request.nextUrl.searchParams.get(param));
    if (value) return value;
  }
  const referrer = URL.parse(request.headers.get("referer") ?? "")?.hostname.replace(/^www\./, "");
  if (!referrer || referrer === request.nextUrl.hostname.replace(/^www\./, "")) return "direct";
  return referrer.slice(0, MAX_SOURCE_LENGTH);
}
