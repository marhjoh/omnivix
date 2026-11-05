import "server-only";
import { Schema, SchemaIssue } from "effect";

// Building blocks for the API's schemas. Each has its own message because Effect's default
// messages repeat the value that failed.

/** One of `values`, with the message naming them all. */
export function oneOf<const L extends ReadonlyArray<string | number>>(values: L) {
  const names = values.map((value) => (typeof value === "string" ? `"${value}"` : value));
  return Schema.Literals(values).annotate({ message: `Must be one of ${names.join(", ")}` });
}

export const text = Schema.String.annotate({ message: "Must be text" });

/** Text that isn't empty. */
export const requiredText = text.check(Schema.isMinLength(1, { message: "Required" }));

export function textUpTo(maxLength: number) {
  return Schema.isMaxLength(maxLength, { message: `Must be at most ${maxLength} characters` });
}

export const flag = Schema.Boolean.annotate({ message: "Must be true or false" });

export function numberBetween(minimum: number, maximum: number) {
  return Schema.Finite.annotate({ message: "Must be a number" }).check(
    Schema.isBetween(
      { minimum, maximum },
      { message: `Must be between ${minimum} and ${maximum}` },
    ),
  );
}

export function textWhere(test: (value: string) => boolean, message: string) {
  return text.check(Schema.makeFilter(test, { message }));
}

/**
 * A field that failed, e.g. `{ path: "state.username", message: "Required" }`. It never holds the
 * value.
 */
export interface FieldIssue {
  path: string;
  message: string;
}

const formatIssues = SchemaIssue.makeFormatterStandardSchemaV1({
  leafHook: (issue) =>
    issue._tag === "MissingKey" ? "Required" : SchemaIssue.defaultLeafHook(issue),
});

/** The fields that failed, as paths under `prefix`. A failure of the whole value gets "request". */
export function fieldIssues(issue: SchemaIssue.Issue, prefix?: string): FieldIssue[] {
  return formatIssues(issue).issues.map(({ path, message }) => ({
    path:
      [prefix, ...(path ?? []).map((part) => String(typeof part === "object" ? part.key : part))]
        .filter((part) => part !== undefined)
        .join(".") || "request",
    message,
  }));
}
