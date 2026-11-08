import { formatNames, type LinkImageType } from "@/src/lib/imageSource";
import { fetchPublic, PublicFetchError, type PublicFetchProblem } from "@/src/lib/publicFetch";
import { megabytes } from "@/src/lib/text";

const MAX_LINKED_IMAGE_BYTES = 10 * 1024 * 1024;

/** A downloaded image, served to the render page in place of its link. */
export interface ImageBytes {
  contentType: string;
  body: Buffer;
}

/** A link the export won't use; `message` is shown to the user. */
export class ImageLinkError extends Error {}

const NOT_ALLOWED = "That image link isn't allowed. Use a public https:// image.";

function problemMessage(problem: PublicFetchProblem, types: readonly LinkImageType[]): string {
  switch (problem) {
    case "invalid-url":
      return "That image link isn't a valid URL.";
    case "not-https":
      return "Image links must start with https://.";
    case "not-public":
      return NOT_ALLOWED;
    case "not-found":
      return "Couldn't find that image link.";
    case "unreachable":
      return "Couldn't load the image link.";
    case "bad-status":
      return "Couldn't load that image link. It may have moved or be private.";
    case "rate-limited":
      return "The image's site is refusing requests for now. Try again later.";
    case "wrong-type":
      return `That link isn't a ${formatNames(types)} image.`;
    case "too-large":
      return `The linked image is larger than ${megabytes(MAX_LINKED_IMAGE_BYTES)}.`;
    case "too-many-redirects":
      return "The image link redirects too many times.";
    case "invalid-redirect":
      return "That image link redirects to an invalid address.";
    case "insecure-redirect":
      return "That image link redirects to an insecure address.";
  }
}

/**
 * Downloads an image link for export, with `fetchPublic`'s rules. The image must be one of `types`
 * and at most `MAX_LINKED_IMAGE_BYTES`. Throws `ImageLinkError` when the link can't be used.
 * `signal` cancels the download (see the timeout in `resolveExportImages`).
 */
export async function fetchImageLink(
  link: string,
  types: readonly LinkImageType[],
  signal = new AbortController().signal,
): Promise<ImageBytes> {
  try {
    return await fetchPublic(link, {
      accept: types.join(","),
      acceptsType: (contentType) => types.some((type) => type === contentType),
      maxBytes: MAX_LINKED_IMAGE_BYTES,
      signal,
    });
  } catch (error) {
    if (error instanceof PublicFetchError) {
      throw new ImageLinkError(problemMessage(error.problem, types));
    }
    throw error;
  }
}
