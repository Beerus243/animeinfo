import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDir = path.join(process.cwd(), "public", "og");
const outputFile = path.join(outputDir, "placeholder-1200x630.svg");

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#F6F1E8"/>
  <circle cx="151" cy="118" r="220" fill="#EB5E28" fill-opacity="0.12"/>
  <circle cx="1080" cy="560" r="240" fill="#358D7B" fill-opacity="0.16"/>
  <rect x="84" y="90" width="1032" height="450" rx="42" fill="#FFF9F0" stroke="#E7DBCC"/>
  <text x="120" y="230" fill="#EB5E28" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="6">ANIMEINFO</text>
  <text x="120" y="330" fill="#1C160F" font-family="Arial, sans-serif" font-size="72" font-weight="700">Anime news stack</text>
  <text x="120" y="415" fill="#6F6457" font-family="Arial, sans-serif" font-size="34">RSS import, editorial review, SEO and monetization-ready publishing.</text>
</svg>`.trim();

async function run() {
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputFile, svg, "utf8");
  console.log(`Generated ${outputFile}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});