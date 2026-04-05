"use client";

import { ThemedIcon } from "@/src/theme/ThemedBrand";
import styles from "./preview.module.css";

export function PreviewEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.stateInner}>
      <ThemedIcon className={styles.stateLogo} size={44} />
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
