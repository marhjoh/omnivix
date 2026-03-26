import { CSSProperties, PropsWithChildren } from "react";

export function BannerTitle({
  children,
  style,
}: PropsWithChildren<{ style?: CSSProperties }>) {
  return (
    <h2
      style={{
        fontSize: 36,
        lineHeight: 1.1,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

export function BannerMuted({
  children,
  style,
}: PropsWithChildren<{ style?: CSSProperties }>) {
  return <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 16, ...style }}>{children}</p>;
}
