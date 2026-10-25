"use client";

import dynamic from "next/dynamic";

// Every page loads this boundary, so its page (the site header and footer) loads only on an error.
const PageError = dynamic(() => import("@/src/error-pages/PageError"));

/** Errors in a page. Errors in the root layout go to global-error.tsx. */
export default function ErrorPage(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <PageError {...props} />;
}
