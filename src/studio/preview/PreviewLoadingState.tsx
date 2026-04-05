import styles from "./preview.module.css";

export function PreviewLoadingState({ message }: { message: string }) {
  return (
    <div className={styles.stateInner} role="status" aria-live="polite" aria-busy="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/icon.svg" alt="" className={styles.pulseLogo} />
      <p className={styles.loadingText}>{message}</p>
      <div className={styles.skeletonRow} aria-hidden />
      <div className={styles.skeletonRowNarrow} aria-hidden />
    </div>
  );
}
