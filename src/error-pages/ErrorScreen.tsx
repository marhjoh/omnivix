import type { ReactNode } from "react";
import type { ErrorCode } from "@/src/error-pages/calendarGlyphs";
import { CodeCalendar } from "@/src/error-pages/CodeCalendar";
import landingStyles from "@/src/landing/landing.module.css";

/** Layout of the 404 and error pages. */
export function ErrorScreen({
  code,
  title,
  children,
  actions,
}: {
  code: ErrorCode;
  title: string;
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <main className="flex-1 overflow-x-clip bg-bg px-4 pt-16 pb-20 sm:pt-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <CodeCalendar code={code} />
        </div>
        <h1
          className={`${landingStyles.gradientText} ${landingStyles.headingOnLoad} mt-10 md:mt-14`}
        >
          {title}
        </h1>
        <div className="mt-4 max-w-xl text-lg leading-relaxed text-pretty text-muted">
          {children}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
      </div>
    </main>
  );
}
