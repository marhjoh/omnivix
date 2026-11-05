import "server-only";
import { Schema } from "effect";

// Why an export failed, after its request was checked; GitHub problems from the render page are
// src/github/errors.ts. The route turns each into its response (see exportRoute); anything else is
// a defect and answers 500.

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

/** Chromium couldn't render the banner: a browser error, an HTTP error or a Vercel login. */
export class RenderFailed extends Schema.TaggedError<RenderFailed>()("RenderFailed", {
  cause: Schema.Defect(),
}) {}

/** The whole export took longer than its deadline; Chromium has been closed. */
export class ExportTimedOut extends Schema.TaggedError<ExportTimedOut>()("ExportTimedOut", {}) {}
