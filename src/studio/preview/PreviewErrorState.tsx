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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/icon.svg" alt="" className={styles.stateLogo} style={{ opacity: 0.55 }} />
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
