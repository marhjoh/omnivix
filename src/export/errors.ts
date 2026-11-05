import "server-only";
import { Schema } from "effect";

// Why an export failed, after its request was checked. The route turns each into its response
// (see exportRoute); anything else is a defect and answers 500.

/** The visitor's daily export quota is used up until `resetAt`. */
export class DailyExportLimitReached extends Schema.TaggedError<DailyExportLimitReached>()(
  "DailyExportLimitReached",
  { resetAt: Schema.Date },
) {}

/** An uploaded or linked image the export won't use; `message` is shown to the user. */
export class UnusableImage extends Schema.TaggedError<UnusableImage>()("UnusableImage", {
  message: Schema.String,
}) {}

/** The settings don't fit in the render URL. */
export class SettingsTooLong extends Schema.TaggedError<SettingsTooLong>()("SettingsTooLong", {}) {}

/** The render page hit GitHub's rate limit, which resets at `resetAt`. */
export class GithubLimitReached extends Schema.TaggedError<GithubLimitReached>()(
  "GithubLimitReached",
  { resetAt: Schema.Date },
) {}

/** The banner's GitHub user doesn't exist, so retrying can't help. */
export class GithubUserMissing extends Schema.TaggedError<GithubUserMissing>()(
  "GithubUserMissing",
  {},
) {}

/** Chromium couldn't render the banner: a browser error, an HTTP error or a Vercel login. */
export class RenderFailed extends Schema.TaggedError<RenderFailed>()("RenderFailed", {
  cause: Schema.Defect(),
}) {}

/** The whole export took longer than its deadline; Chromium has been closed. */
export class ExportTimedOut extends Schema.TaggedError<ExportTimedOut>()("ExportTimedOut", {}) {}
