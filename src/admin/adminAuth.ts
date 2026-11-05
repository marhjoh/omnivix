import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Checks the admin page's HTTP Basic Auth on the server, for every request. Any username works;
 * the password is `ADMIN_PASSWORD`. Without it the page doesn't exist (404).
 */
export function checkAdminAuth(request: Request): Response | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return new Response("Not found", { status: 404 });
  const given = passwordOf(request.headers.get("authorization"));
  return given !== null && sameText(given, password) ? null : askForPassword();
}

function askForPassword(): Response {
  return new Response("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Omnivix admin", charset="UTF-8"' },
  });
}

function passwordOf(header: string | null): string | null {
  const [scheme, encoded] = header?.split(" ") ?? [];
  if (scheme?.toLowerCase() !== "basic" || !encoded) return null;
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const colon = decoded.indexOf(":");
  return colon === -1 ? null : decoded.slice(colon + 1);
}

/** Compares hashes, so neither the time taken nor the length gives the password away. */
function sameText(a: string, b: string): boolean {
  const hash = (text: string) => createHash("sha256").update(text).digest();
  return timingSafeEqual(hash(a), hash(b));
}
