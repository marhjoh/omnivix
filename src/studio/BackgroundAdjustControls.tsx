import { Move } from "lucide-react";
import { MAX_BACKGROUND_ZOOM, MIN_BACKGROUND_ZOOM } from "@/src/banner/background";

/** Position and zoom controls shown under the background picker once a background is chosen. */
export function BackgroundAdjustControls({
  id,
  adjusting,
  onToggleAdjusting,
  zoom,
  onZoomChange,
  canReset,
  onReset,
}: {
  id: string;
  adjusting: boolean;
  onToggleAdjusting: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  canReset: boolean;
  onReset: () => void;
}) {
  const zoomId = `${id}-zoom`;
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          aria-pressed={adjusting}
          onClick={onToggleAdjusting}
          className={`btn-secondary flex-1 px-3 py-1.5 text-xs ${
            adjusting ? "border-accent bg-accent/10" : ""
          }`}
        >
          <Move className="h-3.5 w-3.5" aria-hidden />
          {adjusting ? "Done" : "Adjust position"}
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={!canReset}
          className="btn-secondary px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset
        </button>
      </div>
      <label htmlFor={zoomId} className="block text-xs font-medium text-muted">
        Zoom: {Math.round(zoom * 100)}%
      </label>
      <input
        id={zoomId}
        type="range"
        min={MIN_BACKGROUND_ZOOM}
        max={MAX_BACKGROUND_ZOOM}
        step={0.05}
        value={zoom}
        onChange={(e) => onZoomChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}
