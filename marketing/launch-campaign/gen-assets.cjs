// Generates the launch-campaign social graphics (1080x1080) from SVG templates.
// Run from the app root: node marketing/launch-campaign/gen-assets.cjs
const sharp = require('sharp');
const path = require('path');
const OUT = __dirname;

const SLATE = '#40536B', TERRA = '#C17A5A', IVORY = '#F2E9DC', DARK = '#2A3644';

const base = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <rect width="1080" height="1080" fill="${SLATE}"/>
  <circle cx="980" cy="60" r="300" fill="${IVORY}" opacity="0.06"/>
  <circle cx="90" cy="1010" r="280" fill="${TERRA}" opacity="0.09"/>
  ${inner}
</svg>`;

const wordmark = (y = 150, size = 92) => `
  <text x="540" y="${y}" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-style="italic" font-size="${size}" letter-spacing="-2">niksen</text>
  <text x="540" y="${y + 44}" text-anchor="middle" fill="${TERRA}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="22" letter-spacing="10">SECRET BAR</text>`;

const footer = (y = 1005) => `
  <text x="540" y="${y}" text-anchor="middle" fill="${IVORY}" fill-opacity="0.9" font-family="Helvetica, Arial, sans-serif" font-weight="500" font-size="26">Bophut · Koh Samui</text>
  <text x="540" y="${y + 38}" text-anchor="middle" fill="#FFFFFF" fill-opacity="0.75" font-family="Menlo, monospace" font-weight="700" font-size="24">niksensamui.com</text>`;

const assets = {
  // 1. Opening announcement
  'announce-opening.jpg': base(`
    ${wordmark()}
    <text x="540" y="430" text-anchor="middle" fill="${IVORY}" font-family="Georgia, serif" font-style="italic" font-size="46">the art of doing nothing</text>
    <text x="540" y="600" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="150" letter-spacing="2">18.08</text>
    <text x="540" y="680" text-anchor="middle" fill="${TERRA}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="34" letter-spacing="6">WE OPEN</text>
    <line x1="390" y1="760" x2="690" y2="760" stroke="${IVORY}" stroke-opacity="0.35" stroke-width="2"/>
    <text x="540" y="830" text-anchor="middle" fill="${IVORY}" font-family="Helvetica, Arial, sans-serif" font-weight="500" font-size="30">Café · Coffee · Slow breakfasts</text>
    <text x="540" y="880" text-anchor="middle" fill="${IVORY}" fill-opacity="0.8" font-family="Helvetica, Arial, sans-serif" font-size="26">Every day 07:00–14:00 · 17:00–23:00</text>
    ${footer()}`),

  // 2-4. Countdown series
  ...Object.fromEntries([7, 3, 1].map(n => [`countdown-${n}.jpg`, base(`
    ${wordmark()}
    <text x="540" y="620" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="420">${n}</text>
    <text x="540" y="730" text-anchor="middle" fill="${TERRA}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="36" letter-spacing="8">${n === 1 ? 'DAY TO GO' : 'DAYS TO GO'}</text>
    <text x="540" y="820" text-anchor="middle" fill="${IVORY}" font-family="Georgia, serif" font-style="italic" font-size="34">${n === 1 ? 'tomorrow · 07:00' : 'opening 18 August'}</text>
    ${footer()}`)])),

  // 5. Opening day
  'opening-day.jpg': base(`
    ${wordmark()}
    <text x="540" y="470" text-anchor="middle" fill="${TERRA}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="40" letter-spacing="10">TODAY</text>
    <text x="540" y="620" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="120">WE'RE OPEN</text>
    <text x="540" y="710" text-anchor="middle" fill="${IVORY}" font-family="Georgia, serif" font-style="italic" font-size="40">come do nothing with us</text>
    <line x1="390" y1="780" x2="690" y2="780" stroke="${IVORY}" stroke-opacity="0.35" stroke-width="2"/>
    <text x="540" y="850" text-anchor="middle" fill="${IVORY}" font-family="Helvetica, Arial, sans-serif" font-weight="500" font-size="32">from 07:00 · order at niksensamui.com/order</text>
    ${footer()}`),
};

(async () => {
  for (const [name, svg] of Object.entries(assets)) {
    await sharp(Buffer.from(svg), { density: 96 }).resize(1080, 1080).jpeg({ quality: 90 }).toFile(path.join(OUT, name));
    console.log('generated', name);
  }
  // 6. Tea-season card: real tea photo background + slate overlay + text
  const teaOverlay = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
    <rect width="1080" height="1080" fill="${DARK}" opacity="0.45"/>
    <rect y="640" width="1080" height="440" fill="url(#g)"/>
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${DARK}" stop-opacity="0"/><stop offset="1" stop-color="${DARK}" stop-opacity="0.92"/>
    </linearGradient></defs>
    <text x="540" y="180" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-style="italic" font-size="80" letter-spacing="-2">niksen</text>
    <text x="540" y="222" text-anchor="middle" fill="#E8B88A" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="20" letter-spacing="9">SECRET BAR</text>
    <text x="540" y="840" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-style="italic" font-size="64">Signature Tea Season</text>
    <text x="540" y="905" text-anchor="middle" fill="${IVORY}" font-family="Helvetica, Arial, sans-serif" font-weight="500" font-size="32">five island teas · ฿120</text>
    <text x="540" y="985" text-anchor="middle" fill="#FFFFFF" fill-opacity="0.8" font-family="Menlo, monospace" font-weight="700" font-size="24">niksensamui.com/order</text>
  </svg>`;
  await sharp(path.join(__dirname, '..', '..', 'public', 'menu', 'beachy-sunset-oolong.jpg'))
    .resize(1080, 1080, { fit: 'cover' })
    .composite([{ input: Buffer.from(teaOverlay) }])
    .jpeg({ quality: 90 })
    .toFile(path.join(OUT, 'tea-season.jpg'));
  console.log('generated tea-season.jpg');
})().catch(e => { console.error(String(e)); process.exit(1); });
