// Facebook page assets: circular-safe profile photo + 2.63:1 cover.
// Run from the app root: node marketing/launch-campaign/gen-fb.cjs
const sharp = require('sharp');
const path = require('path');
const OUT = __dirname;

const SLATE = '#40536B', TERRA = '#C17A5A', IVORY = '#F2E9DC';

// Profile: 1000x1000. Facebook masks this to a circle, so keep art inside ~68% width.
const profile = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
  <rect width="1000" height="1000" fill="${SLATE}"/>
  <circle cx="880" cy="120" r="230" fill="${IVORY}" opacity="0.06"/>
  <circle cx="120" cy="900" r="220" fill="${TERRA}" opacity="0.10"/>
  <text x="500" y="530" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-style="italic" font-size="190" letter-spacing="-6">niksen</text>
  <circle cx="500" cy="600" r="14" fill="${TERRA}"/>
  <text x="500" y="672" text-anchor="middle" fill="${TERRA}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="40" letter-spacing="16">SECRET BAR</text>
</svg>`;

// Cover: 1640x624 (2.63:1). Mobile crops the sides hard, so keep key art centred.
const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="1640" height="624" viewBox="0 0 1640 624">
  <rect width="1640" height="624" fill="${SLATE}"/>
  <circle cx="1500" cy="80" r="300" fill="${IVORY}" opacity="0.06"/>
  <circle cx="120" cy="600" r="260" fill="${TERRA}" opacity="0.09"/>
  <text x="820" y="230" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-style="italic" font-size="130" letter-spacing="-4">niksen</text>
  <text x="820" y="286" text-anchor="middle" fill="${TERRA}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="28" letter-spacing="14">SECRET BAR</text>
  <text x="820" y="380" text-anchor="middle" fill="${IVORY}" font-family="Georgia, serif" font-style="italic" font-size="46">the art of doing nothing</text>
  <line x1="620" y1="430" x2="1020" y2="430" stroke="${IVORY}" stroke-opacity="0.35" stroke-width="2"/>
  <text x="820" y="490" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="34" letter-spacing="2">OPENING 18.08.2026 · BOPHUT, KOH SAMUI</text>
  <text x="820" y="545" text-anchor="middle" fill="${IVORY}" fill-opacity="0.85" font-family="Helvetica, Arial, sans-serif" font-size="28">Every day 07:00–14:00 · 17:00–23:00 · niksensamui.com</text>
</svg>`;

(async () => {
  await sharp(Buffer.from(profile), { density: 96 }).resize(1000, 1000).jpeg({ quality: 92 })
    .toFile(path.join(OUT, 'fb-profile.jpg'));
  console.log('generated fb-profile.jpg');
  await sharp(Buffer.from(cover), { density: 96 }).resize(1640, 624).jpeg({ quality: 92 })
    .toFile(path.join(OUT, 'fb-cover.jpg'));
  console.log('generated fb-cover.jpg');
})().catch(e => { console.error(String(e)); process.exit(1); });
