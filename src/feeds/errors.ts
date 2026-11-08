import "server-only";
import { Schema } from "effect";

/** A feed link that can't be read; `message` is shown to the user. */
export class FeedUnreadable extends Schema.TaggedError<FeedUnreadable>()("FeedUnreadable", {
  message: Schema.String,
}) {}
