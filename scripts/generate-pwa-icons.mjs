// Renders the brand mark (app/icon.svg) to the PNG sizes the web app manifest
// and iOS need. Re-run after changing the logo:  node scripts/generate-pwa-icons.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const svg = readFileSync(new URL('../app/icon.svg', import.meta.url));
const out = (name) => fileURLToPath(new URL(`../public/icons/${name}`, import.meta.url));
const BRAND = '#2954e5';

// "any" icons: the mark on a transparent background.
for (const size of [192, 512]) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(out(`icon-${size}.png`));
}

// Maskable / iOS icons: full-bleed brand background with the mark inside the
// ~60% safe zone, so OS-applied masks (circle, squircle) never clip it.
async function padded(size, name) {
  const inner = Math.round(size * 0.6);
  const mark = await sharp(svg, { density: 384 }).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BRAND } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(out(name));
}
await padded(512, 'maskable-512.png');
await padded(180, 'apple-touch-icon.png');
console.log('PWA icons written to public/icons');
