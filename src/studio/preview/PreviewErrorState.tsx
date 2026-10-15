"use client";

import { ThemedIcon } from "@/src/theme/ThemedBrand";
import styles from "./preview.module.css";

export function PreviewErrorState({
  message,
  hint,
  action,
}: {
  message: string;
  hint: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className={styles.stateInner} role="alert">
      <ThemedIcon className={styles.stateLogoMuted} size={44} />
      <p className={styles.errorTitle}>{message}</p>
      <p className={styles.description}>{hint}</p>
      {action ? (
        <button
          type="button"
          className={`btn-secondary ${styles.retryButton}`}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
