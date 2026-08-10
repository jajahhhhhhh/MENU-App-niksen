/**
 * Seed the "Signature Tea" section.
 *
 *   npm run seed:tea
 *
 * Idempotent: inserts each drink if missing, otherwise refreshes its recipe +
 * photo (leaving price/availability alone so real prices aren't clobbered).
 * Photos live in public/menu/ and are served at /menu/*.jpg.
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

const CATEGORY = 'Signature Tea';
const PRICE = 120; // Confirmed price — all signature teas are ฿120.

interface Tea {
  name: string;
  image: string;
  desc: string;
  desc_th: string;
  desc_ru: string;
}

const TEAS: Tea[] = [
  { name: 'Beachy Sunset Oolong', image: '/menu/beachy-sunset-oolong.jpg',
    desc: 'Oolong tea, passion fruit & honey', desc_th: 'ชาอู่หลง เสาวรส และน้ำผึ้ง', desc_ru: 'Улун, маракуйя и мёд' },
  { name: 'Island Hibiscus Splash', image: '/menu/island-hibiscus-splash.jpg',
    desc: 'Hibiscus tea, lychee & lemon', desc_th: 'ชากระเจี๊ยบ ลิ้นจี่ และเลมอน', desc_ru: 'Каркаде, личи и лимон' },
  { name: 'Mandalay Coconut Sunrise', image: '/menu/mandalay-coconut-sunrise.jpg',
    desc: 'Honey & local coconut', desc_th: 'น้ำผึ้ง และมะพร้าวท้องถิ่น', desc_ru: 'Мёд и местный кокос' },
  { name: 'Samui Coconut Breeze', image: '/menu/samui-coconut-breeze.jpg',
    desc: 'Jasmine green tea & local coconut', desc_th: 'ชาเขียวมะลิ และมะพร้าวท้องถิ่น', desc_ru: 'Жасминовый зелёный чай и местный кокос' },
  { name: 'Tropical Mango Drift', image: '/menu/tropical-mango-drift.jpg',
    desc: 'Fruit tea & local mango', desc_th: 'ชาผลไม้ และมะม่วงท้องถิ่น', desc_ru: 'Фруктовый чай и местное манго' },
];

const findItem = db.prepare('SELECT id FROM menu_items WHERE name = ? AND category = ?');
const insert = db.prepare(`
  INSERT INTO menu_items (name, description, description_th, description_ru, category, price, image_url, available, stock_quantity, low_stock_threshold)
  VALUES (@name, @desc, @desc_th, @desc_ru, @category, @price, @image, 1, 50, 10)
`);
const update = db.prepare(`
  UPDATE menu_items SET description=@desc, description_th=@desc_th, description_ru=@desc_ru, image_url=@image WHERE id=@id
`);

let added = 0;
let updated = 0;
const run = db.transaction(() => {
  for (const t of TEAS) {
    const row = findItem.get(t.name, CATEGORY) as { id: number } | undefined;
    if (row) {
      update.run({ id: row.id, desc: t.desc, desc_th: t.desc_th, desc_ru: t.desc_ru, image: t.image });
      updated++;
    } else {
      insert.run({ name: t.name, desc: t.desc, desc_th: t.desc_th, desc_ru: t.desc_ru, category: CATEGORY, price: PRICE, image: t.image });
      added++;
    }
  }
});
run();

const total = (db.prepare('SELECT COUNT(*) AS n FROM menu_items WHERE category = ?').get(CATEGORY) as { n: number }).n;
console.log(`✓ Signature Tea: ${added} added, ${updated} refreshed (${total} total, ฿${PRICE} each).`);
db.close();
