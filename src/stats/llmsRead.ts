import "server-only";
import { userAgent, type NextRequest } from "next/server";
import { countStats } from "@/src/stats/stats";
import { SERIES } from "@/src/stats/statFields";

/**
 * Crawlers and assistants that name themselves in the User-Agent. Several also send a browser's
 * User-Agent around their name, so they're checked before the browser.
 */
const KNOWN_READERS = [
  "ChatGPT-User",
  "GPTBot",
  "OAI-SearchBot",
  "Claude-User",
  "Claude-SearchBot",
  "ClaudeBot",
  "Perplexity-User",
  "PerplexityBot",
  "MistralAI-User",
  "DuckAssistBot",
  "Googlebot",
  "bingbot",
  "Applebot",
  "Amazonbot",
  "meta-externalagent",
  "Bytespider",
  "CCBot",
];

/** Unknown names come from the User-Agent, which anyone can set. */
const MAX_NAME_LENGTH = 30;

/** Counts a request for `/llms.txt`, by who sent it. */
export function countLlmsRead(request: NextRequest): void {
  countStats([`${SERIES.llmsReader}:${readerOf(request)}`]);
}

/** A known agent, "Browser", or the User-Agent's first word, like "curl" or "node". */
function readerOf(request: NextRequest): string {
  const { ua, browser } = userAgent(request);
  const lower = ua.toLowerCase();
  const known = KNOWN_READERS.find((name) => lower.includes(name.toLowerCase()));
  if (known) return known;
  if (browser.name) return "Browser";
  return /^[\w.-]+/.exec(ua)?.[0].slice(0, MAX_NAME_LENGTH) || "unknown";
}
