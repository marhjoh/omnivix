import { Spinner } from "@/src/ui/Spinner";
import { useExportProgress } from "@/src/studio/preview/useExportProgress";
import { useKeepWhile } from "@/src/ui/useKeepWhile";
import styles from "@/src/studio/preview/preview.module.css";

/**
 * Covers the preview while an export runs: the banner dims, a light band sweeps across it (not with
 * reduced motion), and a pill says how far along it is. Quick exports don't show it.
 */
export function ExportProgress({ running }: { running: boolean }) {
  const text = useExportProgress(running);
  // The last text stays in the pill while it fades out.
  const shownText = useKeepWhile(text, text === null);
  return (
    <>
      <div className={styles.exportOverlay} data-shown={text !== null} aria-hidden>
        <div className={styles.exportStatus}>
          <Spinner />
          <span className={styles.exportStatusText}>{shownText}</span>
        </div>
      </div>
      {/* Always there, so screen readers announce each new text. */}
      <span className="sr-only" role="status">
        {text}
      </span>
    </>
  );
}
