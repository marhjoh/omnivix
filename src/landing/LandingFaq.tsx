import { ChevronDown } from "lucide-react";
import { FAQ } from "@/src/landing/landingContent";

// Answers stay plain strings for the JSON-LD and /llms.txt; URLs in them become links here.
// The lookahead leaves sentence punctuation after a URL out of the link.
const URL_PATTERN = /(https:\/\/\S+?)(?=[.,;:]?(?:\s|$))/;

function AnswerText({ text }: { text: string }) {
  return text.split(URL_PATTERN).map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={part}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-sm text-accent underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:outline-hidden"
      >
        {part.replace(/^https:\/\//, "")}
      </a>
    ) : (
      part
    ),
  );
}

// <details> keeps every answer in the server HTML, so crawlers read it without running JS.
export function LandingFaq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="scroll-mt-[5.5rem] bg-bg px-4 pb-20 sm:pb-24 md:scroll-mt-24"
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="faq-heading"
          className="mb-10 text-center text-2xl font-semibold tracking-tight text-text sm:text-3xl md:mb-12"
        >
          Questions
        </h2>
        <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-surface/40">
          {FAQ.map(({ question, answer }) => (
            <details key={question} className="group px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md py-4 font-medium text-text focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:outline-hidden [&::-webkit-details-marker]:hidden">
                {question}
                <ChevronDown
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-muted">
                <AnswerText text={answer} />
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
