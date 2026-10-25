"use client";

import { ThemedIcon } from "@/src/theme/ThemedBrand";
import styles from "./preview.module.css";

/** The button row's space, for a state without a button, so every state is equally tall. */
export function PreviewActionSpace() {
  return (
    <span className={`btn-secondary invisible ${styles.action}`} aria-hidden>
      {"\u00a0"}
    </span>
  );
}

/** In place of the banner: why it's empty or what's wrong, and the next step when there is one. */
export function PreviewMessage({
  title,
  hint,
  action,
  alert = false,
}: {
  title: string;
  hint: string;
  action?: { label: string; onClick: () => void; disabled?: boolean };
  /** A problem, announced right away; an empty banner just waits for input. */
  alert?: boolean;
}) {
  return (
    <div className={styles.stateInner} role={alert ? "alert" : undefined}>
      <ThemedIcon className={styles.stateLogo} size={56} />
      <h2 className={styles.title}>{title}</h2>
      <p className={`${styles.description} ${styles.hintRow}`}>{hint}</p>
      {action ? (
        <button
          type="button"
          className={`btn-secondary ${styles.action}`}
          onClick={action.onClick}
          disabled={action.disabled}
        >
          {action.label}
        </button>
      ) : (
        <PreviewActionSpace />
      )}
    </div>
  );
}
