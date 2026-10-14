// Generates public/favicon.svg and public/og.jpg (the link-preview image).
// Run with: node scripts/make-icons.mjs
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { FACE, PETAL, PETAL_VEIN, LION_CENTER, petalAngles } from '../src/lib/lion.ts';

const { x, y } = LION_CENTER;
const lionPaths = (stroke, width) => {
  const parts = [
    ...petalAngles.map((a) => `<g transform="rotate(${a} ${x} ${y})"><path d="${PETAL}"/><path d="${PETAL_VEIN}" stroke-width="${width * 0.6}"/></g>`),
    ...FACE.map((d) => `<path d="${d}"/>`),
  ];
  return `<g fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${parts.join('')}</g>`;
};

// Favicon: magenta lion on a saffron disc (reads well on light and dark tabs).
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="49" fill="#F2A900"/><g transform="translate(5 3) scale(.9)">${lionPaths('#1F1420', 4.2)}</g></svg>`;
writeFileSync('public/favicon.svg', favicon);

// Open Graph image, 1200×630.
const W = 1200, H = 630;
const photo = await sharp('src/assets/images/diya-headshot.jpg')
  .resize(380, 470, { fit: 'cover', position: 'attention' })
  .extend({ top: 14, bottom: 14, left: 14, right: 14, background: '#FFFDF7' })
  .toBuffer();
const dots = Array.from({ length: 40 * 21 }, (_, i) => {
  const cx = (i % 40) * 30 + 15, cy = Math.floor(i / 40) * 30 + 15;
  return `<circle cx="${cx}" cy="${cy}" r="1.6" fill="#6B5A60" opacity=".3"/>`;
}).join('');
const card = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="100%" height="100%" fill="#FBF4E6"/>
  ${dots}
  <g transform="translate(700 70) scale(4.8)" opacity=".25">${lionPaths('#B0175F', 1.6)}</g>
  <text x="64" y="120" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="4" fill="#6B5A60">DIYA SIMHA · UC DAVIS</text>
  <text x="60" y="250" font-family="Arial Black, Segoe UI Black, sans-serif" font-size="92" font-weight="900" letter-spacing="-3" fill="#1F1420">Welcome to</text>
  <text x="60" y="350" font-family="Arial Black, Segoe UI Black, sans-serif" font-size="92" font-weight="900" letter-spacing="-3"><tspan fill="#B0175F">Diya's</tspan><tspan fill="#1F1420" dx="24">world.</tspan></text>
  <text x="64" y="430" font-family="Georgia, serif" font-style="italic" font-size="52" fill="#0E7C7B">It's a little loud in here.</text>
  <rect x="64" y="500" width="400" height="64" rx="32" fill="#F2A900" stroke="#1F1420" stroke-width="3"/>
  <text x="264" y="542" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="700" fill="#1F1420">Operations · Strategy · AI</text>
</svg>`;
await sharp(Buffer.from(card))
  .composite([{ input: await sharp(photo).rotate(4, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(), left: 760, top: 60 }])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile('public/og.jpg');
console.log('✓ public/favicon.svg, public/og.jpg');
