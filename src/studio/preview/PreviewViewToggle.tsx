import { Monitor, Smartphone, Tv } from "lucide-react";
import { BANNER_VIEWS, type BannerView } from "@/src/lib/sizes";
import controls from "@/src/studio/controls.module.css";
import previewStyles from "@/src/studio/preview/preview.module.css";

const VIEWS = {
  phone: { label: "Phone", Icon: Smartphone },
  desktop: { label: "Desktop", Icon: Monitor },
  tv: { label: "TV", Icon: Tv },
} as const;

/** Under a format that devices crop (YouTube): show what a phone, desktop or TV shows. */
export function PreviewViewToggle({
  view,
  onChange,
}: {
  view: BannerView;
  onChange: (view: BannerView) => void;
}) {
  return (
    <div role="group" aria-label="Preview as" className={previewStyles.views}>
      {BANNER_VIEWS.map((option) => {
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
  );
}
