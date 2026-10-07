import { HOW_IT_WORKS } from "@/src/landing/landingContent";

export function LandingHowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading" className="bg-bg px-4 pb-20 sm:pb-24">
      <div className="mx-auto max-w-6xl">
        <h2
          id="how-it-works-heading"
          className="mb-10 text-center text-2xl font-semibold tracking-tight text-text sm:text-3xl md:mb-12"
        >
          How it works
        </h2>
        <ol className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title} className="rounded-xl border border-border/60 bg-surface/40 p-5">
              <span
                aria-hidden
                className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent"
              >
                {i + 1}
              </span>
              <h3 className="font-semibold tracking-tight text-text">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
