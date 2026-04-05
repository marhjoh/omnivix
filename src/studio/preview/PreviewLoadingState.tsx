"use client";

import { ThemedIcon } from "@/src/theme/ThemedBrand";
import styles from "./preview.module.css";

export function PreviewLoadingState({ message }: { message: string }) {
  return (
    <div className={styles.stateInner} role="status" aria-live="polite" aria-busy="true">
      <ThemedIcon className={styles.pulseLogo} size={44} />
      <p className={styles.loadingText}>{message}</p>
      <div className={styles.skeletonRow} aria-hidden />
      <div className={styles.skeletonRowNarrow} aria-hidden />
    </div>
  );
}
