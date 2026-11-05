"use client";

import dynamic from "next/dynamic";
import type { RuntimeErrorProps } from "@/src/error-pages/RuntimeError";

// Every page includes this boundary. Loading the error page lazily keeps the site header and
// footer out of pages that don't use them.
const PageError = dynamic(() => import("@/src/error-pages/PageError"));

/** Errors in a page. Errors in the root layout go to global-error.tsx. */
export default function ErrorPage(props: RuntimeErrorProps) {
  return <PageError {...props} />;
}
