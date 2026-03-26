import { CSSProperties, PropsWithChildren } from "react";

export function Frame({
  children,
  backgroundImage,
  style,
  isExport = false,
}: PropsWithChildren<{ backgroundImage?: string; style?: CSSProperties; isExport?: boolean }>) {
  return (
    <div
      className="banner-export-root"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: isExport ? 0 : 12,
        border: isExport ? "none" : "1px solid rgba(255,255,255,0.12)",
        overflow: "hidden",
        position: "relative",
        background: "#0f172a",
        ...style,
      }}
    >
      {backgroundImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundImage}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.28,
          }}
        />
      ) : null}
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>{children}</div>
    </div>
  );
}
