"use client";

import { ThemedIcon } from "@/src/theme/ThemedBrand";
import styles from "./preview.module.css";

export function PreviewErrorState({
  message,
  hint,
  onRetry,
}: {
  message: string;
  hint: string;
  onRetry?: () => void;
}) {
  return (
    <div className={styles.stateInner} role="alert">
      <ThemedIcon className={styles.stateLogoMuted} size={44} />
      <p className={styles.errorTitle}>{message}</p>
      <p className={styles.description}>{hint}</p>
      {onRetry ? (
        <button type="button" className={`btn-secondary ${styles.retryButton}`} onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
