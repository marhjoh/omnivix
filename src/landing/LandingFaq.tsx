import { FAQ, FAQ_TOPICS } from "@/src/landing/landingContent";
import { SectionHeading } from "@/src/landing/SectionHeading";
import { linkText } from "@/src/lib/text";
import { SITE_LINKS } from "@/src/lib/site";
import { textLinkClass } from "@/src/ui/classNames";
import landingStyles from "@/src/landing/landing.module.css";

// Answers are plain strings because the JSON-LD and /llms.txt use them too. URLs in them become
// links here. The lookahead keeps a period or comma after a URL out of the link.
const URL_PATTERN = /(https:\/\/\S+?)(?=[.,;:]?(?:\s|$))/;

function AnswerText({ text }: { text: string }) {
  return text.split(URL_PATTERN).map((part, i) =>
    i % 2 === 1 ? (
      <a key={part} href={part} target="_blank" rel="noopener noreferrer" className={textLinkClass}>
        {linkText(part)}
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
          <a href={SITE_LINKS.newIssue} className={textLinkClass}>
            Open an issue on GitHub
          </a>
          .
        </p>
        {/* Topic headings are smaller than the step words and bigger than the questions. The
            line under each one marks where its group starts. */}
        <div className="space-y-8 md:space-y-10">
          {FAQ_TOPICS.map((topic) => (
            <div key={topic}>
              <h3 className="border-b border-divider-strong pb-3 text-xl font-bold tracking-tight text-text sm:text-2xl">
                {topic}
              </h3>
              {FAQ.filter((item) => item.topic === topic).map(({ question, answer }) => (
                <details
                  key={question}
                  className={`group border-b border-divider-strong ${landingStyles.faqItem}`}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-md py-4 font-medium text-text focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-hidden [&::-webkit-details-marker]:hidden">
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
