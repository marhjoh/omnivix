import type { ExportRequest } from "@/src/export/request";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 120;

/**
 * Without `EXPORT_TOKEN_SECRET`, a random secret per server process: tokens can't be forged, but
 * only that process can verify them. Vercel runs the export and the render page in separate
 * functions, so it needs the shared secret.
 */
const processSecret = randomBytes(32).toString("base64url");

function getSecret(): string {
  const secret = process.env.EXPORT_TOKEN_SECRET;
  if (secret) return secret;
  if (process.env.VERCEL) {
    throw new Error("EXPORT_TOKEN_SECRET is required on Vercel");
  }
  return processSecret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

type TokenBody = {
  exp: number;
  payload: ExportRequest;
};

/** Stateless export token: the HMAC-signed payload, embedded in the render URL. */
export function createExportToken(payload: ExportRequest): string {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const body: TokenBody = { exp, payload };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

/**
 * Verifies signature + expiry and returns the payload. The same token works until it expires.
 */
export function verifyExportToken(token: string): ExportRequest | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expectedSignature = sign(encoded);
  if (
    expectedSignature.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
  ) {
    return null;
  }

  // Signed by us, so it's the body createExportToken wrote.
  const { exp, payload }: TokenBody = JSON.parse(Buffer.from(encoded, "base64url").toString());
  return exp < Math.floor(Date.now() / 1000) ? null : payload;
}
