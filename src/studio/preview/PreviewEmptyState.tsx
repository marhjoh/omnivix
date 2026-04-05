import styles from "./preview.module.css";

export function PreviewEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.stateInner}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/icon.svg" alt="" className={styles.stateLogo} />
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
