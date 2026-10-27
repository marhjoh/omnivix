import { MAX_BACKGROUND_ZOOM, MIN_BACKGROUND_ZOOM } from "@/src/banner/background";
import { FieldLabel } from "@/src/ui/FieldLabel";

/** Zoom slider step: 5 percentage points. */
const ZOOM_STEP = 0.05;

/**
 * The background's zoom, shown in the picker's frame (ImagePicker) once an image is
 * chosen. The image is moved by dragging the preview (BackgroundDragSurface).
 */
export function BackgroundZoomControl({
  id,
  zoom,
  onZoomChange,
}: {
  id: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}) {
  const zoomId = `${id}-zoom`;
  const percent = `${Math.round(zoom * 100)}%`;
  return (
    <div className="space-y-1.5">
      <FieldLabel
        htmlFor={zoomId}
        end={<span className="field-label tabular-nums">{percent}</span>}
      >
        Zoom
      </FieldLabel>
      <input
        id={zoomId}
        type="range"
        min={MIN_BACKGROUND_ZOOM}
        max={MAX_BACKGROUND_ZOOM}
        step={ZOOM_STEP}
        value={zoom}
        aria-valuetext={percent}
        onChange={(e) => onZoomChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}
