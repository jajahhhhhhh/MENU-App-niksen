// Google review QR: a bare SVG for the web, plus a print-ready counter card.
//   npm i qrcode --no-save && node marketing/gen-review-qr.cjs
//
// The review link is the Google-issued short link for the Niksen listing
// (place ID ChIJ9f4L7jHxVDAR7ZTeDy0xXpY). It opens Google's write-a-review
// dialog directly — one tap for the customer, which is the whole point.
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const REVIEW_URL = 'https://g.page/r/Ce2U3g8tMV6WEAI/review';
const ROOT = path.join(__dirname, '..');

const SLATE = '#40536B', TERRA = '#C17A5A', IVORY = '#F2E9DC', INK = '#2A3644';

(async () => {
  // 1. Bare QR for the website — same shape as qr-order.svg.
  const bare = await QRCode.toString(REVIEW_URL, {
    type: 'svg', errorCorrectionLevel: 'M', margin: 4,
    color: { dark: INK, light: '#ffffff' },
  });
  fs.writeFileSync(path.join(ROOT, 'public', 'qr-review.svg'), bare);
  console.log('generated public/qr-review.svg');

  // 2. Print card. The QR is embedded as an inner <svg> so its own viewBox
  //    scales independently of the card's — nesting the raw markup without
  //    that wrapper would inherit the card's coordinate system and blow the
  //    modules up to full-card size.
  const inner = bare
    .replace(/<\?xml[^>]*\?>/, '')
    .replace(/<!DOCTYPE[^>]*>/, '')
    .replace('<svg', '<svg x="270" y="470" width="460" height="460"')
    .trim();

  // A6 proportions (105x148mm) at 1000x1410 — print at any size, it scales.
  const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1410" viewBox="0 0 1000 1410">
  <rect width="1000" height="1410" fill="${SLATE}"/>
  <circle cx="920" cy="90" r="260" fill="${IVORY}" opacity="0.06"/>
  <circle cx="60" cy="1340" r="240" fill="${TERRA}" opacity="0.10"/>

  <text x="500" y="190" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-style="italic" font-size="96" letter-spacing="-3">niksen</text>
  <text x="500" y="238" text-anchor="middle" fill="${TERRA}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="24" letter-spacing="11">SECRET BAR</text>

  <text x="500" y="360" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-style="italic" font-size="58">Enjoyed it?</text>
  <text x="500" y="420" text-anchor="middle" fill="${IVORY}" fill-opacity="0.9" font-family="Helvetica, Arial, sans-serif" font-size="30">A review helps us more than you'd think.</text>

  <rect x="240" y="440" width="520" height="520" rx="36" fill="#FFFFFF"/>
  ${inner}

  <text x="500" y="1035" text-anchor="middle" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="34" letter-spacing="1">Scan to review us on Google</text>

  <text x="500" y="1110" text-anchor="middle" fill="${IVORY}" fill-opacity="0.88" font-family="Helvetica, Arial, sans-serif" font-size="30">ถูกใจไหม? รีวิวให้เราหน่อยได้ไหม</text>
  <text x="500" y="1160" text-anchor="middle" fill="${IVORY}" fill-opacity="0.88" font-family="Helvetica, Arial, sans-serif" font-size="30">Понравилось? Оставьте отзыв</text>

  <line x1="330" y1="1230" x2="670" y2="1230" stroke="${IVORY}" stroke-opacity="0.3" stroke-width="2"/>

  <text x="500" y="1300" text-anchor="middle" fill="#FFFFFF" fill-opacity="0.85" font-family="Menlo, monospace" font-weight="700" font-size="28">niksensamui.com</text>
  <text x="500" y="1350" text-anchor="middle" fill="${IVORY}" fill-opacity="0.6" font-family="Helvetica, Arial, sans-serif" font-size="24">Bophut · Koh Samui</text>
</svg>`;

  fs.writeFileSync(path.join(__dirname, 'review-card.svg'), card);
  console.log('generated marketing/review-card.svg');
})().catch(e => { console.error(String(e)); process.exit(1); });
