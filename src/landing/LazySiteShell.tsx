"use client";

import dynamic from "next/dynamic";

/**
 * SiteShell for app/not-found.tsx. The root 404 page is part of every page's tree, so a static
 * import would load the site header and footer on every page, the studio's too; this loads them
 * only when a 404 shows. Still rendered on the server.
 */
export const LazySiteShell = dynamic(() =>
  import("@/src/landing/SiteShell").then((m) => m.SiteShell),
);
