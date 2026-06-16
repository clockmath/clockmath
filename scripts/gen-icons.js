// One-off icon generator: rasterizes public/logo.svg onto a branded slate
// background to produce favicon / apple-touch / PWA icons. Run with `node
// scripts/gen-icons.js` after changing the logo. Output PNGs are committed.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const svg = fs.readFileSync(path.join(root, 'public/logo.svg'));
const BG = { r: 15, g: 23, b: 42, alpha: 1 }; // slate-900 (#0F172A)

async function gen(size, outPath, pad = 0.12) {
  const logoSize = Math.round(size * (1 - pad * 2));
  const offset = Math.round((size - logoSize) / 2);
  const logo = await sharp(svg, { density: 384 }).resize(logoSize, logoSize).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: logo, top: offset, left: offset }])
    .png()
    .toFile(path.join(root, outPath));
  console.log('wrote', outPath);
}

(async () => {
  await gen(64, 'app/icon.png');
  await gen(180, 'app/apple-icon.png');
  await gen(192, 'public/icon-192.png');
  await gen(512, 'public/icon-512.png');
})();
