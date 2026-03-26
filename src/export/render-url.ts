export function buildRenderUrl(origin: string, templateId: string, token: string) {
  const base = origin.endsWith("/") ? origin.slice(0, -1) : origin;
  return `${base}/render/${templateId}?token=${encodeURIComponent(token)}`;
}
