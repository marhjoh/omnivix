import type { TemplateId } from "@/src/types/template";
import type { PreviewContentState } from "./types";

export function computePreviewContentState(params: {
  hydrated: boolean;
  templateId: TemplateId;
  needsUsername: boolean;
  username: string;
  quoteText: string;
  dataError: string | null;
  dataReady: boolean;
}): PreviewContentState {
  const username = params.username.trim();
  const quote = params.quoteText.trim();

  if (!params.hydrated) {
    return "loading";
  }

  if (params.needsUsername && !username) {
    return "empty";
  }

  if (params.templateId === "quote-banner" && !quote) {
    return "empty";
  }

  if (params.dataError) {
    return "error";
  }

  if (params.needsUsername && username && !params.dataReady) {
    return "loading";
  }

  return "ready";
}

export function previewLoadingMessage(templateId: TemplateId): string {
  switch (templateId) {
    case "github-banner":
      return "Loading profile and contributions…";
    case "contribution-banner":
      return "Loading contributions…";
    case "repos-banner":
      return "Loading profile and repositories…";
    default:
      return "Loading…";
  }
}

export function previewEmptyCopy(templateId: TemplateId): { title: string; description: string } {
  switch (templateId) {
    case "quote-banner":
      return {
        title: "Add your quote",
        description: "Enter quote text in the sidebar to see it here.",
      };
    default:
      return {
        title: "Choose a GitHub profile",
        description: "Select a username to load data for this banner.",
      };
  }
}
