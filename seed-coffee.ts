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

const rows = db.prepare('SELECT name, price FROM menu_items WHERE category = ? ORDER BY price').all(CATEGORY) as { name: string; price: number }[];
console.log(`✓ Coffee: ${added} added, ${updated} refreshed — ${rows.length} total`);
console.log('  ' + rows.map(r => `${r.name} ฿${r.price}`).join(' · '));
db.close();
