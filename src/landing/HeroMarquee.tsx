import Image from "next/image";
import type { TemplateId } from "@/src/types/template";
import { landingPreviewSrc } from "@/src/landing/landingPreviewAssets";
import styles from "@/src/landing/landing.module.css";

const TEMPLATES: TemplateId[] = [
  "github-banner",
  "repos-banner",
  "quote-banner",
  "contribution-banner",
];
const CARDS_PER_COLUMN = 6;
const COLUMNS = 4;

/** Each column starts at a different template, so neighbouring cards never repeat. */
const columns = Array.from({ length: COLUMNS }, (_, col) =>
  Array.from({ length: CARDS_PER_COLUMN }, (_, row) => TEMPLATES[(col + row) % TEMPLATES.length]),
);

/**
 * Decorative wall of banner previews on a tilted 3D plane; columns drift slowly in alternating
 * directions (CSS animation, paused for prefers-reduced-motion) and fade out at the edges.
 * Hidden from assistive tech: the Templates grid below names every template.
 */
export function HeroMarquee() {
  return (
    <div className={styles.marquee} aria-hidden>
      <div className={styles.marqueeWall}>
        {columns.map((column, i) => (
          <div key={i} className={styles.marqueeColumn} data-reverse={i % 2 === 1}>
            {column.map((templateId, j) => (
              <div key={j} className={styles.marqueeCard}>
                {/* Eager: only 4 distinct URLs (fetched once each), and cards drifting into view
                    shouldn't pop in while they load. */}
                <Image
                  src={landingPreviewSrc(templateId)}
                  alt=""
                  fill
                  sizes="400px"
                  loading="eager"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
