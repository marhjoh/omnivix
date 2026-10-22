import { MAX_BACKGROUND_ZOOM, MIN_BACKGROUND_ZOOM } from "@/src/banner/background";

/** Zoom slider step: 5 percentage points. */
const ZOOM_STEP = 0.05;

/**
 * The background's zoom, shown in the picker's frame (BackgroundImagePicker) once an image is
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
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={zoomId} className="field-label">
          Zoom
        </label>
        <span className="field-label tabular-nums">{Math.round(zoom * 100)}%</span>
      </div>
      <input
        id={zoomId}
        type="range"
        min={MIN_BACKGROUND_ZOOM}
        max={MAX_BACKGROUND_ZOOM}
        step={ZOOM_STEP}
        value={zoom}
        onChange={(e) => onZoomChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}
