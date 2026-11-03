export function buildRenderUrl(origin: string, templateId: string, token: string) {
  return `${origin}/render/${templateId}?token=${encodeURIComponent(token)}`;
}
