import { HOW_IT_WORKS } from "@/src/landing/landingContent";
import { SectionHeading } from "@/src/landing/SectionHeading";
import landingStyles from "@/src/landing/landing.module.css";

/** One big word per step, shown above its title. */
const STEP_WORDS = ["Pick.", "Enter.", "Download."];

export function LandingHowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="overflow-x-clip bg-bg px-4 pb-20 sm:pb-28"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading id="how-it-works-heading">How it works.</SectionHeading>
        {/* The <ol> numbers the steps for screen readers; the big words are decoration. */}
        <ol className="space-y-12 sm:space-y-16">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title} className={i % 2 === 1 ? "sm:text-right" : undefined}>
              <span className={landingStyles.stepWord} aria-hidden>
                {STEP_WORDS[i]}
              </span>
              <div
                className={`${landingStyles.stepText} mt-3 max-w-md sm:mt-4 ${i % 2 === 1 ? "sm:ml-auto" : ""}`}
              >
                <h3 className="text-lg font-semibold tracking-tight text-text">
                  <span className="text-accent-hover">{i + 1}.</span> {step.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
