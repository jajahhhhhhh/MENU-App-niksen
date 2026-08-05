/**
 * Seed the espresso-bar Coffee section.
 *
 *   npm run seed:coffee
 *
 * Idempotent: inserts each drink if missing, otherwise refreshes name/recipe
 * translations (leaving price + availability alone so counter edits stick).
 * Prices confirmed by the owner, 6 Aug 2026.
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

const COFFEES: Coffee[] = [
  { name: 'Espresso', name_th: 'เอสเพรสโซ', name_ru: 'Эспрессо', price: 60,
    desc: 'A short, bright shot — the house roast on its own',
    desc_th: 'ช็อตเข้มข้น รสชาติชัดเจนจากเมล็ดคั่วประจำร้าน',
    desc_ru: 'Короткий яркий шот — наша обжарка в чистом виде' },
  { name: 'Americano', name_th: 'อเมริกาโน', name_ru: 'Американо', price: 70,
    desc: 'Espresso lengthened with hot water — long and easy',
    desc_th: 'เอสเพรสโซเติมน้ำร้อน ดื่มสบาย จิบได้เรื่อย ๆ',
    desc_ru: 'Эспрессо с горячей водой — мягкий и долгий' },
  { name: 'Latte', name_th: 'ลาเต้', name_ru: 'Латте', price: 90,
    desc: 'Espresso with steamed milk — soft, milky, unhurried',
    desc_th: 'เอสเพรสโซกับนมสตีม นุ่มละมุน ดื่มช้า ๆ',
    desc_ru: 'Эспрессо с молоком — мягкий и неспешный' },
  { name: 'Cappuccino', name_th: 'คาปูชิโน', name_ru: 'Капучино', price: 90,
    desc: 'Espresso under a deep cap of foam',
    desc_th: 'เอสเพรสโซกับฟองนมหนานุ่ม',
    desc_ru: 'Эспрессо под плотной молочной пеной' },
];

const findItem = db.prepare('SELECT id FROM menu_items WHERE name = ? AND category = ?');
const insert = db.prepare(`
  INSERT INTO menu_items (name, name_th, name_ru, description, description_th, description_ru, category, price, available, stock_quantity, low_stock_threshold)
  VALUES (@name, @name_th, @name_ru, @desc, @desc_th, @desc_ru, @category, @price, 1, 50, 10)
`);
const update = db.prepare(`
  UPDATE menu_items SET name_th=@name_th, name_ru=@name_ru, description=@desc, description_th=@desc_th, description_ru=@desc_ru WHERE id=@id
`);

let added = 0;
let updated = 0;
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
if (wired.length) console.log(`✓ Photos wired: ${wired.join(', ')}`);
if (awaiting.length) {
  console.log(`· Awaiting photos (drop the file in, re-run this script):`);
  for (const a of awaiting) console.log(`    ${a}`);
}
db.close();
