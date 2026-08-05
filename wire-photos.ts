/**
 * Attach static dish photos to menu items.
 *
 *   npm run wire:photos
 *
 * The map is written out by hand rather than matched on names automatically:
 * the photo library this came from covers a wider menu than niksen's, and a
 * near-miss like "watermelon juice" landing on a photo of a watermelon *shake*
 * is a customer-facing error. Only exact, confirmed pairings belong here.
 *
 * Idempotent, and safe to run with files missing — an absent photo is reported
 * and skipped, leaving the item on its grey placeholder rather than writing a
 * path that would render as a broken image.
 *
 * Signature Tea photos are wired by seed-tea.ts, Coffee by seed-coffee.ts.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const db = new Database('pos.db');
db.pragma('busy_timeout = 5000');

const MENU_DIR = path.join('public', 'menu');

// Menu item name -> file in public/menu/
const PHOTOS: Record<string, string> = {
  'Avocado Breakfast': 'avocado-breakfast.webp',
  'Avocado Veggie Sandwich': 'avocado-veggie-sandwich.webp',
  'English Breakfast': 'english-breakfast.webp',
  'Green Pesto Oats': 'green-pesto-oats.webp',
  'Mediterranean Omelette': 'mediterranean-omelette.webp',
  'Salmon Breakfast': 'salmon-breakfast.webp',
  'Shakshuka': 'shakshuka.webp',
  'Syrniki': 'syrniki.webp',
  'Red Sunset': 'red-sunset.webp',
};

const findItem = db.prepare('SELECT id, name, image_url FROM menu_items WHERE name = ?');
const setImage = db.prepare('UPDATE menu_items SET image_url = ? WHERE id = ?');

const wired: string[] = [];
const unchanged: string[] = [];
const noFile: string[] = [];
const noItem: string[] = [];

const run = db.transaction(() => {
  for (const [name, file] of Object.entries(PHOTOS)) {
    if (!fs.existsSync(path.join(MENU_DIR, file))) { noFile.push(`${name} → ${MENU_DIR}/${file}`); continue; }
    const row = findItem.get(name) as { id: number; name: string; image_url: string | null } | undefined;
    if (!row) { noItem.push(name); continue; }
    const url = `/menu/${file}`;
    if (row.image_url === url) { unchanged.push(name); continue; }
    // Items carrying a base64 data URI get swapped to the static file: the same
    // image, but served once and cached instead of inflating every menu
    // response by ~75KB.
    setImage.run(url, row.id);
    wired.push(row.image_url?.startsWith('data:') ? `${name} (replaced inline data URI)` : name);
  }
});
run();

const total = db.prepare('SELECT COUNT(*) AS n FROM menu_items').get() as { n: number };
const withPhoto = db.prepare(
  "SELECT COUNT(*) AS n FROM menu_items WHERE image_url IS NOT NULL AND image_url != ''"
).get() as { n: number };

if (wired.length) { console.log(`✓ Wired ${wired.length}:`); for (const w of wired) console.log(`    ${w}`); }
if (unchanged.length) console.log(`· Already correct: ${unchanged.join(', ')}`);
if (noFile.length) { console.log(`· Photo file missing:`); for (const f of noFile) console.log(`    ${f}`); }
if (noItem.length) console.log(`· No menu item by that name (renamed in the POS?): ${noItem.join(', ')}`);
console.log(`\nMenu photo coverage: ${withPhoto.n}/${total.n} items`);

db.close();
