import { Monitor, Smartphone, Tv } from "lucide-react";
import type { BannerView } from "@/src/lib/sizes";
import { TileGroup } from "@/src/studio/TileGroup";
import controls from "@/src/studio/controls.module.css";
import previewStyles from "@/src/studio/preview/preview.module.css";

const VIEWS = {
  phone: { label: "Phone", Icon: Smartphone },
  desktop: { label: "Desktop", Icon: Monitor },
  tv: { label: "TV", Icon: Tv },
} as const;

/**
 * Previews what a phone, desktop or TV shows of a format that devices crop (YouTube, Reddit). The
 * label is visible so the tiles don't look like download options. The download is always the full
 * image.
 */
export function PreviewViewToggle({
  views,
  view,
  onChange,
}: {
  views: readonly BannerView[];
  view: BannerView;
  onChange: (view: BannerView) => void;
}) {
  return (
    <TileGroup
      label="Preview as"
      className={previewStyles.views}
      labelClassName={previewStyles.viewsLabel}
      tilesClassName={previewStyles.viewTiles}
      tileClassName={controls.viewTile}
      options={views.map((option) => ({ value: option, ...VIEWS[option] }))}
      value={view}
      onChange={onChange}
    >
      {({ label, Icon }) => (
        <>
          <Icon className="h-4 w-4 text-muted" aria-hidden />
          {label}
        </>
      )}
    </TileGroup>
  );
}
