/**
 * Seed the Coffee section — a single house drink, Black Rest Coffee ฿90.
 *
 *   npm run seed:coffee
 *
 * Idempotent: inserts the drink if missing, otherwise refreshes its
 * translations (leaving price + availability alone so counter edits stick).
 * Also prunes any other Coffee row, so the old espresso-bar list cannot come
 * back. Price confirmed by the owner, 11 Aug 2026.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const db = new Database('pos.db');
db.pragma('busy_timeout = 5000');

// Make sure the columns exist even if run before the server applies migrations.
for (const col of [
  'name_th TEXT', 'name_ru TEXT',
  'description TEXT', 'description_th TEXT', 'description_ru TEXT', 'image_url TEXT',
]) {
  try { db.exec(`ALTER TABLE menu_items ADD COLUMN ${col}`); } catch {}
}

const CATEGORY = 'Coffee';

interface Coffee {
  name: string;
  name_th: string;
  name_ru: string;
  price: number;
  desc: string;
  desc_th: string;
  desc_ru: string;
}

// ONE house coffee, not an espresso-bar line-up (owner-confirmed 11 Aug 2026).
// The previous five drinks — Espresso/Americano/Latte/Cappuccino/Cold Brew —
// were never on the real menu; anything this script does not list is removed
// below, so re-running it cannot bring them back.
const COFFEES: Coffee[] = [
  { name: 'Black Rest Coffee', name_th: 'แบล็ก เรสต์ คอฟฟี่', name_ru: 'Блэк Рест Кофе', price: 90,
    desc: 'The house coffee — black, and the only one on the menu. Nothing to choose.',
    desc_th: 'กาแฟดำประจำร้าน มีแค่ตัวเดียว ไม่ต้องเลือกอะไรทั้งนั้น',
    desc_ru: 'Наш кофе — чёрный, единственный в меню. Выбирать ничего не нужно.' },
];

const findItem = db.prepare('SELECT id FROM menu_items WHERE name = ? AND category = ?');
const insert = db.prepare(`
  INSERT INTO menu_items (name, name_th, name_ru, description, description_th, description_ru, category, price, available, stock_quantity, low_stock_threshold)
  VALUES (@name, @name_th, @name_ru, @desc, @desc_th, @desc_ru, @category, @price, 1, 50, 10)
`);
const update = db.prepare(`
  UPDATE menu_items SET name_th=@name_th, name_ru=@name_ru, description=@desc, description_th=@desc_th, description_ru=@desc_ru WHERE id=@id
`);

// Coffee rows that are not in COFFEES are leftovers from the old espresso-bar
// list. Drop them — but only when nothing has ever been ordered against them.
// An item referenced by a past order is disabled instead of deleted, because
// deleting it would leave order history pointing at a missing row.
const stale = db.prepare(`
  SELECT m.id, m.name, (SELECT COUNT(*) FROM order_items oi WHERE oi.menu_item_id = m.id) AS orders
  FROM menu_items m WHERE m.category = ?`);
const del = db.prepare('DELETE FROM menu_items WHERE id = ?');
const disable = db.prepare('UPDATE menu_items SET available = 0 WHERE id = ?');

let added = 0;
let updated = 0;
const removed: string[] = [];
const disabled: string[] = [];
const run = db.transaction(() => {
  for (const c of COFFEES) {
    const row = findItem.get(c.name, CATEGORY) as { id: number } | undefined;
    if (row) {
      update.run({ id: row.id, name_th: c.name_th, name_ru: c.name_ru, desc: c.desc, desc_th: c.desc_th, desc_ru: c.desc_ru });
      updated++;
    } else {
      insert.run({ ...c, category: CATEGORY });
      added++;
    }
  }

  const keep = new Set(COFFEES.map(c => c.name));
  for (const row of stale.all(CATEGORY) as { id: number; name: string; orders: number }[]) {
    if (keep.has(row.name)) continue;
    if (row.orders > 0) { disable.run(row.id); disabled.push(row.name); }
    else { del.run(row.id); removed.push(row.name); }
  }
});
run();

// Attach photos the same way the teas are wired: a static file at
// public/menu/<slug>.jpg becomes /menu/<slug>.jpg on the item. The slug comes
// from the drink name, so a coffee added later in the POS picks up its photo
// with no code change. A missing file is skipped rather than written — the tile
// keeps its grey placeholder instead of showing a broken image, which is what
// makes this safe to run before the photos exist.
// Strip accents first so "Caffè Latte" slugs to caffe-latte, not caff-latte.
const slugify = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const MENU_DIR = path.join('public', 'menu');
const setImage = db.prepare('UPDATE menu_items SET image_url = ? WHERE id = ?');

const coffeeRows = db.prepare('SELECT id, name, price, image_url FROM menu_items WHERE category = ? ORDER BY price')
  .all(CATEGORY) as { id: number; name: string; price: number; image_url: string | null }[];

const wired: string[] = [];
const awaiting: string[] = [];
for (const row of coffeeRows) {
  const file = `${slugify(row.name)}.jpg`;
  if (fs.existsSync(path.join(MENU_DIR, file))) {
    const url = `/menu/${file}`;
    if (row.image_url !== url) setImage.run(url, row.id);
    wired.push(row.name);
  } else if (!row.image_url) {
    awaiting.push(`${row.name} → ${MENU_DIR}/${file}`);
  }
}

console.log(`✓ Coffee: ${added} added, ${updated} refreshed — ${coffeeRows.length} total`);
console.log('  ' + coffeeRows.map(r => `${r.name} ฿${r.price}`).join(' · '));
if (removed.length) console.log(`✓ Removed (never ordered): ${removed.join(', ')}`);
if (disabled.length) console.log(`· Disabled (kept — referenced by past orders): ${disabled.join(', ')}`);
if (wired.length) console.log(`✓ Photos wired: ${wired.join(', ')}`);
if (awaiting.length) {
  console.log(`· Awaiting photos (drop the file in, re-run this script):`);
  for (const a of awaiting) console.log(`    ${a}`);
}
db.close();
