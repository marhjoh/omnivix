import { PropsWithChildren } from "react";
import styles from "./preview.module.css";

/** Fills the banner preview card; keeps state UI aligned with final banner footprint. */
export function PreviewFrame({ children }: PropsWithChildren) {
  return <div className={styles.frameFill}>{children}</div>;
}
