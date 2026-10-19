import { FAQ, FAQ_TOPICS } from "@/src/landing/landingContent";
import { SectionHeading } from "@/src/landing/SectionHeading";
import { SITE_LINKS } from "@/src/lib/site-links";
import landingStyles from "@/src/landing/landing.module.css";

const linkClass =
  "rounded-sm text-accent-hover underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:outline-hidden";

// Answers stay plain strings for the JSON-LD and /llms.txt; URLs in them become links here.
// The lookahead leaves sentence punctuation after a URL out of the link.
const URL_PATTERN = /(https:\/\/\S+?)(?=[.,;:]?(?:\s|$))/;

function AnswerText({ text }: { text: string }) {
  return text.split(URL_PATTERN).map((part, i) =>
    i % 2 === 1 ? (
      <a key={part} href={part} target="_blank" rel="noopener noreferrer" className={linkClass}>
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
      className="scroll-mt-[5.5rem] overflow-x-clip bg-bg px-4 pb-20 sm:pb-28 md:scroll-mt-24"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading id="faq-heading" className="mb-3 md:mb-4">
          Questions.
        </SectionHeading>
        <p className="mb-8 text-sm text-muted md:mb-10">
          Something missing?{" "}
          <a href={`${SITE_LINKS.repo}/issues/new/choose`} className={linkClass}>
            Open an issue on GitHub
          </a>
          .
        </p>
        {/* Topics sit between the step words and the questions in size; their rule marks where
            each group starts. The same gap above every topic keeps the groups even. */}
        <div className="space-y-8 md:space-y-10">
          {FAQ_TOPICS.map((topic) => (
            <div key={topic}>
              <h3 className="border-b border-border/60 pb-3 text-xl font-bold tracking-tight text-text sm:text-2xl">
                {topic}
              </h3>
              {FAQ.filter((item) => item.topic === topic).map(({ question, answer }) => (
                <details
                  key={question}
                  className={`group border-b border-border/60 ${landingStyles.faqItem}`}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-md py-4 font-medium text-text focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:outline-hidden [&::-webkit-details-marker]:hidden">
                    {question}
                    <span
                      className={`${landingStyles.faqToggle} text-muted group-open:text-accent-hover group-hover:text-accent-hover`}
                      aria-hidden
                    />
                  </summary>
                  <p
                    className={`pb-4 text-sm leading-relaxed text-muted ${landingStyles.faqAnswer}`}
                  >
                    <AnswerText text={answer} />
                  </p>
                </details>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
