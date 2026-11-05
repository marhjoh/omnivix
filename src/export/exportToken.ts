import type { ExportRequest } from "@/src/export/request";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 120;

/**
 * Without `EXPORT_TOKEN_SECRET`, each server process makes a random secret. Tokens still can't be
 * forged, but only that process can verify them. The secret lives on `globalThis` because Next
 * bundles the export route and the render page separately, each with its own copy of this module.
 * Vercel runs them in separate functions, so it needs the shared secret.
 */
const shared = globalThis as { omnivixExportSecret?: string };
shared.omnivixExportSecret ??= randomBytes(32).toString("base64url");
const processSecret = shared.omnivixExportSecret;

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

/**
 * Signs the payload into a token for the render URL. The token holds the whole payload, so nothing
 * is stored on the server.
 */
export function createExportToken(payload: ExportRequest): string {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const body: TokenBody = { exp, payload };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

/**
 * Returns the payload if the signature is valid and the token hasn't expired. A token can be used
 * more than once until then.
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

  // The signature is valid, so this is the body createExportToken wrote.
  const { exp, payload }: TokenBody = JSON.parse(Buffer.from(encoded, "base64url").toString());
  return exp < Math.floor(Date.now() / 1000) ? null : payload;
}
