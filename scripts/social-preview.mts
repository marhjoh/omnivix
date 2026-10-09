// Renders the site Open Graph card at GitHub's social preview size and writes it to
// public/brand/social-preview.jpg. GitHub can't load the preview from a URL, so upload
// the file by hand under Settings → General → Social preview after regenerating it.
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { GITHUB_SOCIAL_PREVIEW_SIZE, renderSiteOgImage } from "@/src/og/ogImage";

const outPath = join(process.cwd(), "public/brand/social-preview.jpg");

const response = await renderSiteOgImage(GITHUB_SOCIAL_PREVIEW_SIZE);
const image = Buffer.from(await response.arrayBuffer());
await writeFile(outPath, image);

const { width, height } = GITHUB_SOCIAL_PREVIEW_SIZE;
console.log(`Wrote ${outPath} (${width}×${height}, ${Math.round(image.length / 1024)} KB)`);
