// Satori renders plain <img>; next/image does not apply here.
/* eslint-disable @next/next/no-img-element */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { SITE_TAGLINE } from "@/src/lib/site";
import type { TemplateId } from "@/src/types/template";

// Shared by app/opengraph-image.tsx and app/studio/[templateId]/opengraph-image.tsx.
// ImageResponse (Satori) can't decode WebP, so src/og/banners holds 1200px JPEG copies
// of public/landing/*.webp. Regenerate them when the landing banners change.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/jpeg";

const COLORS = {
  bg: "#0d1117",
  text: "#e6edf3",
  muted: "#9da8b3",
  accent: "#2f81f7",
};

// Logo is 968×274.
const LOGO_RATIO = 274 / 968;

const ogDir = join(process.cwd(), "src/og");

async function dataUri(path: string, mime: string) {
  const data = await readFile(path, "base64");
  return `data:${mime};base64,${data}`;
}

const assets = Promise.all([
  readFile(join(ogDir, "fonts/inter-latin-400.ttf")),
  readFile(join(ogDir, "fonts/inter-latin-700.ttf")),
  dataUri(join(process.cwd(), "public/brand/logo.svg"), "image/svg+xml"),
]).then(([regular, bold, logo]) => ({
  fonts: [
    { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: bold, weight: 700 as const, style: "normal" as const },
  ],
  logo,
}));

// ImageResponse only outputs PNG, 200-800 KB for these images. Messenger and WhatsApp skip
// large preview images, so re-encode as JPEG. Runs at build time, since the images are prerendered.
// Baseline, not progressive (mozjpeg: true forces progressive), for the widest crawler support.
async function toJpeg(png: ImageResponse) {
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer()))
    .jpeg({
      quality: 85,
      trellisQuantisation: true,
      overshootDeringing: true,
      optimiseCoding: true,
      quantisationTable: 3,
    })
    .toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: { "Content-Type": OG_CONTENT_TYPE },
  });
}

function bannerSrc(templateId: TemplateId) {
  return dataUri(join(ogDir, "banners", `${templateId}.jpg`), "image/jpeg");
}

const frame = {
  width: "100%",
  height: "100%",
  display: "flex",
  position: "relative",
  overflow: "hidden",
  fontFamily: "Inter",
  color: COLORS.text,
  backgroundColor: COLORS.bg,
  backgroundImage: `radial-gradient(circle at 85% 20%, ${COLORS.accent}33, transparent 55%)`,
} as const;

const bannerStyle = {
  borderRadius: 14,
  border: "1px solid #ffffff22",
  boxShadow: "0 24px 48px #00000080",
} as const;

/** Site-wide preview: logo, tagline and a tilted stack of template banners. */
export async function renderSiteOgImage() {
  const { fonts, logo } = await assets;
  const banners = await Promise.all(
    (["github-banner", "contribution-banner", "quote-banner"] as const).map(bannerSrc),
  );

  return toJpeg(
    new ImageResponse(
      <div style={frame}>
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 600,
            display: "flex",
            flexDirection: "column",
            gap: 28,
            transform: "rotate(-8deg)",
          }}
        >
          {banners.map((src, i) => (
            <img
              alt=""
              key={src.slice(-32)}
              src={src}
              width={720}
              height={180}
              style={{ ...bannerStyle, marginLeft: i * 60 }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 600,
            // Extra bottom padding: X overlays the page title on the bottom-left corner.
            padding: "64px 0 136px 64px",
          }}
        >
          <img alt="" src={logo} width={240} height={Math.round(240 * LOGO_RATIO)} />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1.5 }}>
              {SITE_TAGLINE}
            </div>
            <div style={{ fontSize: 26, color: COLORS.muted, lineHeight: 1.35 }}>
              LinkedIn and X banners from your GitHub profile, repos and contributions.
            </div>
          </div>
        </div>
      </div>,
      { ...OG_SIZE, fonts },
    ),
  );
}

/** Per-template preview: logo, template title and description, and that template's banner. */
export async function renderTemplateOgImage(
  templateId: TemplateId,
  title: string,
  description: string,
) {
  const [{ fonts, logo }, banner] = await Promise.all([assets, bannerSrc(templateId)]);

  return toJpeg(
    new ImageResponse(
      <div style={{ ...frame, flexDirection: "column", padding: 48 }}>
        <img alt="" src={logo} width={180} height={Math.round(180 * LOGO_RATIO)} />
        <div style={{ display: "flex", flexDirection: "column", marginTop: 36, gap: 8 }}>
          <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -1.5 }}>{title}</div>
          <div style={{ fontSize: 30, color: COLORS.muted }}>
            {`${description} For LinkedIn and X.`}
          </div>
        </div>
        <img
          alt=""
          src={banner}
          width={1104}
          height={276}
          style={{ ...bannerStyle, position: "absolute", left: 48, bottom: 40 }}
        />
      </div>,
      { ...OG_SIZE, fonts },
    ),
  );
}
