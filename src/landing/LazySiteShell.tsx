"use client";

import dynamic from "next/dynamic";

/**
 * SiteShell for app/not-found.tsx, loaded lazily. The root 404 page is in every page's tree, so a
 * static import would add the site header and footer to every page, the studio included. It still
 * renders on the server.
 */
export const LazySiteShell = dynamic(() =>
  import("@/src/landing/SiteShell").then((m) => m.SiteShell),
);
