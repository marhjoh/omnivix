import type { TemplateId } from "@/src/types/template";
import type { PreviewContentState, PreviewProblem } from "./types";

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

/** A GitHub request failed: the server's message, with a hint and a retry. */
export function fetchErrorProblem(message: string): PreviewProblem {
  return {
    title: message,
    hint: "Check the username or your connection, then try again.",
    retry: true,
  };
}

/**
 * The repos banner has no repositories to show. Only the user can fix that (pick or pin some), so
 * there's no retry.
 */
export function noReposProblem(mode: string, selectedRepos: string): PreviewProblem {
  if (mode !== "selected") {
    return {
      title: "No pinned repositories",
      hint: "Pin repositories on your GitHub profile, or switch to Selected mode.",
      retry: false,
    };
  }
  return selectedRepos.trim()
    ? {
        title: "No matching repositories",
        hint: "Choose public repositories from the list in the sidebar.",
        retry: false,
      }
    : {
        title: "No repositories selected",
        hint: "Choose public repositories from the list in the sidebar.",
        retry: false,
      };
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
