// Generates Pinterest-optimised 2:3 portrait pins (1000x1500) from SVG templates.
// Run from the app root: node marketing/launch-campaign/gen-pin.cjs
const sharp = require('sharp');
const path = require('path');
const OUT = path.join(__dirname, '..', '..', 'public', 'pins');
require('fs').mkdirSync(OUT, { recursive: true });

const SLATE = '#40536B', TERRA = '#C17A5A', IVORY = '#F2E9DC';

const announce = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1500" viewBox="0 0 1000 1500">
  <rect width="1000" height="1500" fill="${SLATE}"/>
  <circle cx="900" cy="120" r="330" fill="${IVORY}" opacity="0.06"/>
  <circle cx="80" cy="1400" r="300" fill="${TERRA}" opacity="0.09"/>

  <text x="500" y="230" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-style="italic" font-size="112" letter-spacing="-3">niksen</text>
  <text x="500" y="282" text-anchor="middle" fill="${TERRA}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="26" letter-spacing="12">SECRET BAR</text>

  <text x="500" y="470" text-anchor="middle" fill="${IVORY}" font-family="Georgia, serif" font-style="italic" font-size="54">the art of doing nothing</text>

  <text x="500" y="720" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="190" letter-spacing="2">18.08</text>
  <text x="500" y="800" text-anchor="middle" fill="${TERRA}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="40" letter-spacing="8">WE OPEN</text>

  <line x1="330" y1="900" x2="670" y2="900" stroke="${IVORY}" stroke-opacity="0.35" stroke-width="2"/>

  <text x="500" y="990" text-anchor="middle" fill="${IVORY}" font-family="Helvetica, Arial, sans-serif" font-weight="500" font-size="40">Specialty coffee</text>
  <text x="500" y="1050" text-anchor="middle" fill="${IVORY}" font-family="Helvetica, Arial, sans-serif" font-weight="500" font-size="40">Slow breakfasts</text>
  <text x="500" y="1110" text-anchor="middle" fill="${IVORY}" font-family="Helvetica, Arial, sans-serif" font-weight="500" font-size="40">Five island teas</text>

  <line x1="330" y1="1190" x2="670" y2="1190" stroke="${IVORY}" stroke-opacity="0.35" stroke-width="2"/>

  <text x="500" y="1275" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="42" letter-spacing="3">BOPHUT · KOH SAMUI</text>
  <text x="500" y="1335" text-anchor="middle" fill="${IVORY}" fill-opacity="0.85" font-family="Helvetica, Arial, sans-serif" font-size="32">Every day 07:00–14:00 · 17:00–23:00</text>
  <text x="500" y="1425" text-anchor="middle" fill="#FFFFFF" fill-opacity="0.9" font-family="Menlo, monospace" font-weight="700" font-size="32">niksensamui.com</text>
</svg>`;

(async () => {
  await sharp(Buffer.from(announce), { density: 96 }).resize(1000, 1500).jpeg({ quality: 90 })
    .toFile(path.join(OUT, 'pin-opening.jpg'));
  console.log('generated pins/pin-opening.jpg');

  // Tea pin: real tea photo, portrait crop, slate gradient + copy
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1500">
    <rect width="1000" height="1500" fill="#2A3644" opacity="0.35"/>
    <rect y="850" width="1000" height="650" fill="url(#g)"/>
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2A3644" stop-opacity="0"/><stop offset="1" stop-color="#2A3644" stop-opacity="0.94"/>
    </linearGradient></defs>
    <text x="500" y="150" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-style="italic" font-size="90" letter-spacing="-2">niksen</text>
    <text x="500" y="196" text-anchor="middle" fill="#E8B88A" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="22" letter-spacing="10">SECRET BAR</text>
    <text x="500" y="1180" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-style="italic" font-size="72">Signature Tea Season</text>
    <text x="500" y="1255" text-anchor="middle" fill="${IVORY}" font-family="Helvetica, Arial, sans-serif" font-weight="500" font-size="38">five island teas · ฿120</text>
    <text x="500" y="1330" text-anchor="middle" fill="${IVORY}" fill-opacity="0.85" font-family="Helvetica, Arial, sans-serif" font-size="30">Bophut · Koh Samui · opens 18.08</text>
    <text x="500" y="1420" text-anchor="middle" fill="#FFFFFF" fill-opacity="0.9" font-family="Menlo, monospace" font-weight="700" font-size="30">niksensamui.com</text>
  </svg>`;
  await sharp(path.join(__dirname, '..', '..', 'public', 'menu', 'beachy-sunset-oolong.jpg'))
    .resize(1000, 1500, { fit: 'cover' })
    .composite([{ input: Buffer.from(overlay) }])
    .jpeg({ quality: 90 })
    .toFile(path.join(OUT, 'pin-tea.jpg'));
  console.log('generated pins/pin-tea.jpg');
})().catch(e => { console.error(String(e)); process.exit(1); });
