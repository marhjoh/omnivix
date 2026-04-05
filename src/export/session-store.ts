import type { ExportRequest } from "@/src/types/template";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_SECONDS = 120;

type PayloadRow = { expMs: number; payload: ExportRequest };

const GLOBAL_STORE_KEY = "__omnivixExportPayloadById" as const;

/**
 * In-process export payload store. Keeps signed URL tokens short (no giant query strings).
 *
 * The Map lives on `globalThis` so the same store is shared when Next.js loads this module in
 * more than one server bundle (e.g. `/api/export` vs `/render/...`); a plain module-level Map
 * can be empty on the render route and every export would 404.
 *
 * Multi-instance serverless still needs a shared store (e.g. Redis) instead of this Map.
 */
function payloadById(): Map<string, PayloadRow> {
  const g = globalThis as typeof globalThis & { [GLOBAL_STORE_KEY]?: Map<string, PayloadRow> };
  if (!g[GLOBAL_STORE_KEY]) {
    g[GLOBAL_STORE_KEY] = new Map();
  }
  return g[GLOBAL_STORE_KEY];
}

function pruneExpired(): void {
  const now = Date.now();
  const map = payloadById();
  for (const [id, row] of map) {
    if (row.expMs < now) map.delete(id);
  }
}

function sign(value: string): string {
  const secret = process.env.EXPORT_TOKEN_SECRET ?? "omnivix-dev-secret";
  return createHmac("sha256", secret).update(value).digest("base64url");
}

type TokenBody = { exp: number; id: string };

/**
 * Stores the full export payload server-side and returns a compact signed token (for the render URL).
 */
export function createExportToken(payload: ExportRequest): string {
  pruneExpired();
  const id = randomBytes(16).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + DEFAULT_TTL_SECONDS;
  const expMs = exp * 1000;
  payloadById().set(id, { expMs, payload });

  const body: TokenBody = { exp, id };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

/**
 * Verifies the token, loads payload once, removes it (single-use within TTL).
 */
export function consumeExportToken(token: string): ExportRequest | null {
  pruneExpired();
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

  if (decoded.exp < Math.floor(Date.now() / 1000) || typeof decoded.id !== "string") {
    return null;
  }

  const map = payloadById();
  const row = map.get(decoded.id);
  if (!row || row.expMs < Date.now()) {
    map.delete(decoded.id);
    return null;
  }

  map.delete(decoded.id);
  return row.payload;
}
