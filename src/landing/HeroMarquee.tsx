import Image from "next/image";
import type { CSSProperties } from "react";
import { LANDING_TEMPLATE_ORDER, landingPreviewSrc } from "@/src/landing/landingPreviewAssets";
import type { TemplateId } from "@/src/templates/types";
import { BANNER_SIZES, aspectRatioOf } from "@/src/lib/sizes";
import styles from "@/src/landing/landing.module.css";

const COLUMNS = 4;
/** Enough for the two middle columns to show every template between them. */
const CARDS_PER_COLUMN = Math.max(6, Math.ceil(LANDING_TEMPLATE_ORDER.length / 2));

const middleColumn = (first: number) =>
  Array.from(
    { length: CARDS_PER_COLUMN },
    (_, row) => LANDING_TEMPLATE_ORDER[(first + row) % LANDING_TEMPLATE_ORDER.length],
  );

/** One card further on, so a banner and its copy are never in the same row. */
const turned = (column: TemplateId[]) => [...column.slice(1), column[0]];

const middleLeft = middleColumn(0);
const middleRight = middleColumn(CARDS_PER_COLUMN);

/**
 * The middle columns, which show the most, hold every template. The outer ones are mostly faded out
 * and copy the middle column on the other side. Each copy drifts in step with its original, while
 * neighbors drift the other way and share at most one template in view.
 */
const columns = [turned(middleRight), middleLeft, middleRight, turned(middleLeft)];

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
                {/* Eager loading costs little because each card loads a 400px copy, and cards
                    drifting into view shouldn't pop in. */}
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
