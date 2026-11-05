import Image from "next/image";
import type { CSSProperties } from "react";
import { LANDING_TEMPLATE_ORDER, landingPreviewSrc } from "@/src/landing/landingPreviewAssets";
import { BANNER_SIZES, aspectRatioOf } from "@/src/lib/sizes";
import styles from "@/src/landing/landing.module.css";

const CARDS_PER_COLUMN = 6;
const COLUMNS = 4;

/** Each column starts at a different template, so neighboring cards never repeat. */
const columns = Array.from({ length: COLUMNS }, (_, col) =>
  Array.from(
    { length: CARDS_PER_COLUMN },
    (_, row) => LANDING_TEMPLATE_ORDER[(col + row) % LANDING_TEMPLATE_ORDER.length],
  ),
);

/**
 * A decorative wall of tilted banner previews. The columns drift up and down and fade out at the
 * edges. Screen readers skip it because the Templates grid below names every template.
 */
export function HeroMarquee() {
  return (
    <div className={styles.marquee} aria-hidden>
      <div
        className={styles.marqueeWall}
        style={
          {
            "--marquee-columns": COLUMNS,
            "--banner-ratio": aspectRatioOf(BANNER_SIZES.wide),
          } as CSSProperties
        }
      >
        {columns.map((column, i) => (
          <div key={i} className={styles.marqueeColumn} data-reverse={i % 2 === 1}>
            {column.map((templateId, j) => (
              <div key={j} className={styles.marqueeCard}>
                {/* Eager loading costs little with only 4 distinct images, and cards drifting into
                    view shouldn't pop in. */}
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
