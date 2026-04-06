import type { ExportRequest } from "@/src/types/template";
import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_SECONDS = 120;

function sign(value: string): string {
  const secret = process.env.EXPORT_TOKEN_SECRET ?? "omnivix-dev-secret";
  return createHmac("sha256", secret).update(value).digest("base64url");
}

type TokenBody = {
  exp: number;
  payload: ExportRequest;
};

/**
 * Stateless export token: HMAC-signed payload embedded in the URL.
 *
 * Required for serverless (e.g. Vercel): `/api/export` and `/render/...` often run on different
 * lambdas, so an in-memory Map is not shared and would always 404 the render page.
 */
export function createExportToken(payload: ExportRequest): string {
  const exp = Math.floor(Date.now() / 1000) + DEFAULT_TTL_SECONDS;
  const body: TokenBody = { exp, payload };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

/**
 * Verifies signature + expiry and returns the payload. Idempotent (same token works until expiry).
 */
export function consumeExportToken(token: string): ExportRequest | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expectedSignature = sign(encoded);
  if (
    expectedSignature.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
  ) {
    return null;
  }

  let decoded: TokenBody;
  try {
    decoded = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as TokenBody;
  } catch {
    return null;
  }

  if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
  if (!decoded.payload || typeof decoded.payload !== "object") return null;

  return decoded.payload;
}
