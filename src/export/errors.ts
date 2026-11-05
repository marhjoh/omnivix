import "server-only";
import { Schema } from "effect";

// Errors an export can hit after the request is checked. `renderBanner` turns each one into a
// response. GitHub errors are in src/github/errors.ts.

/** An uploaded or linked image the export won't use; `message` is shown to the user. */
export class UnusableImage extends Schema.TaggedError<UnusableImage>()("UnusableImage", {
  message: Schema.String,
}) {}

/** Chromium couldn't render the banner: a browser error, an HTTP error or a Vercel login. */
export class RenderFailed extends Schema.TaggedError<RenderFailed>()("RenderFailed", {
  cause: Schema.Defect(),
}) {}

/** The export ran past its deadline. Chromium is already closed. */
export class ExportTimedOut extends Schema.TaggedError<ExportTimedOut>()("ExportTimedOut", {}) {}
