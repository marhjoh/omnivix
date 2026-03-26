import { ExportRequest } from "@/src/types/template";
import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_SECONDS = 120;

export function createExportToken(payload: ExportRequest): string {
  const exp = Math.floor(Date.now() / 1000) + DEFAULT_TTL_SECONDS;
  const body = JSON.stringify({ exp, payload });
  const encoded = Buffer.from(body).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

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
  const decoded = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as {
    exp: number;
    payload: ExportRequest;
  };
  if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
  return decoded.payload;
}

function sign(value: string): string {
  const secret = process.env.EXPORT_TOKEN_SECRET ?? "omnivix-dev-secret";
  return createHmac("sha256", secret).update(value).digest("base64url");
}
