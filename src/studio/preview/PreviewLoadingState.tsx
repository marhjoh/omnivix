"use client";

import { ThemedIcon } from "@/src/theme/ThemedBrand";
import { PreviewActionSpace } from "./PreviewMessage";
import styles from "./preview.module.css";

export function PreviewLoadingState({ message }: { message: string }) {
  return (
    <div className={styles.stateInner} role="status" aria-live="polite">
      <ThemedIcon className={`${styles.stateLogo} ${styles.pulseLogo}`} size={56} />
      <p className={styles.loadingText}>{message}</p>
      <div className={`${styles.skeleton} ${styles.hintRow}`} aria-hidden>
        <div className={styles.skeletonRow} />
        <div className={`${styles.skeletonRow} ${styles.skeletonRowNarrow}`} />
      </div>
      <PreviewActionSpace />
    </div>
  );
}
