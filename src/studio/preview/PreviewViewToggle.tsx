import { useId } from "react";
import { Monitor, Smartphone, Tv } from "lucide-react";
import type { BannerView } from "@/src/lib/sizes";
import controls from "@/src/studio/controls.module.css";
import previewStyles from "@/src/studio/preview/preview.module.css";

const VIEWS = {
  phone: { label: "Phone", Icon: Smartphone },
  desktop: { label: "Desktop", Icon: Monitor },
  tv: { label: "TV", Icon: Tv },
} as const;

/**
 * Under a format that devices crop (YouTube, Reddit): show what a phone, desktop or TV shows. The
 * label shows, so the tiles don't read as download choices: the download is always the full image.
 */
export function PreviewViewToggle({
  views,
  view,
  onChange,
}: {
  /** The format's views. */
  views: readonly BannerView[];
  view: BannerView;
  onChange: (view: BannerView) => void;
}) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} className={previewStyles.views}>
      <span id={labelId} className={previewStyles.viewsLabel}>
        Preview as
      </span>
      <div className={previewStyles.viewTiles}>
        {views.map((option) => {
          const { label, Icon } = VIEWS[option];
          return (
            <button
              key={option}
              type="button"
              aria-pressed={option === view}
              onClick={() => onChange(option)}
              className={`${controls.tile} ${controls.viewTile}`}
            >
              <Icon className="h-4 w-4 text-muted" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
