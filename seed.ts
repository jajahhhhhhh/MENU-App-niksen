/**
 * Seed the niksen secret bar menu.
 *
 *   npm run seed
 *
 * Idempotent: skips any item (matched by name + category) that already exists,
 * so it is safe to re-run and to extend with new items later. Writes to the same
 * pos.db the server uses; new items appear on the next /api/public/menu request
 * (no server restart needed).
 */
import Database from 'better-sqlite3';

const db = new Database('pos.db');
db.pragma('busy_timeout = 5000');

interface SeedItem {
  name: string;
  th: string;
  ru: string;
  category: string;
  price: number;
}

// Prices in THB. Categories appear on the ordering page in first-seen order.
const MENU: SeedItem[] = [
  // ── Coffee ──────────────────────────────────────────────
  { name: 'Espresso',        th: 'เอสเพรสโซ',            ru: 'Эспрессо',              category: 'Coffee', price: 60 },
  { name: 'Americano',       th: 'อเมริกาโน่',           ru: 'Американо',             category: 'Coffee', price: 70 },
  { name: 'Cappuccino',      th: 'คาปูชิโน่',            ru: 'Капучино',              category: 'Coffee', price: 85 },
  { name: 'Caffè Latte',     th: 'คาเฟ่ลาเต้',           ru: 'Латте',                 category: 'Coffee', price: 90 },
  { name: 'Flat White',      th: 'แฟลตไวท์',             ru: 'Флэт-уайт',             category: 'Coffee', price: 90 },
  { name: 'Mocha',           th: 'มอคค่า',               ru: 'Мокко',                 category: 'Coffee', price: 100 },
  { name: 'Iced Latte',      th: 'ไอซ์ลาเต้',            ru: 'Айс-латте',             category: 'Coffee', price: 95 },
  { name: 'Cold Brew',       th: 'โคลด์บริว',            ru: 'Колд-брю',              category: 'Coffee', price: 110 },

  // ── Bowls ───────────────────────────────────────────────
  { name: 'niksen Signature Bowl', th: 'โบวล์ซิกเนเจอร์ niksen', ru: 'Фирменный боул niksen', category: 'Bowls', price: 229 },
  { name: 'Green Detox Bowl',      th: 'กรีนดีท็อกซ์โบวล์',      ru: 'Зелёный детокс-боул',   category: 'Bowls', price: 199 },
  { name: 'Protein Power Bowl',    th: 'โปรตีนพาวเวอร์โบวล์',    ru: 'Протеиновый боул',      category: 'Bowls', price: 259 },
  { name: 'Tuna Poke Bowl',        th: 'ทูน่าโพเก้โบวล์',        ru: 'Боул поке с тунцом',    category: 'Bowls', price: 269 },
  { name: 'Buddha Bowl',           th: 'บุดด้าโบวล์',            ru: 'Будда-боул',            category: 'Bowls', price: 219 },

  // ── Breakfast ───────────────────────────────────────────
  { name: 'Overnight Oats',  th: 'โอ๊ตข้ามคืน',          ru: 'Ночная овсянка',        category: 'Breakfast', price: 120 },
  { name: 'Avocado Toast',   th: 'อะโวคาโดโทสต์',        ru: 'Тост с авокадо',        category: 'Breakfast', price: 150 },
  { name: 'Eggs Benedict',   th: 'เอ้กเบเนดิกต์',         ru: 'Яйца Бенедикт',         category: 'Breakfast', price: 180 },
  { name: 'Granola & Yogurt',th: 'กราโนล่าและโยเกิร์ต',   ru: 'Гранола с йогуртом',    category: 'Breakfast', price: 130 },
  { name: 'Banana Pancakes', th: 'แพนเค้กกล้วย',          ru: 'Банановые панкейки',    category: 'Breakfast', price: 160 },

  // ── Smoothies ───────────────────────────────────────────
  { name: 'Mango Sunrise',    th: 'มะม่วงซันไรส์',        ru: 'Манговый рассвет',      category: 'Smoothies', price: 90 },
  { name: 'Green Machine',    th: 'กรีนแมชชีน',           ru: 'Зелёный смузи',         category: 'Smoothies', price: 100 },
  { name: 'Berry Blast',      th: 'เบอร์รี่บลาสต์',        ru: 'Ягодный взрыв',         category: 'Smoothies', price: 95 },
  { name: 'Tropical Coconut', th: 'ทรอปิคอลโคโคนัท',      ru: 'Тропический кокос',     category: 'Smoothies', price: 100 },

  // ── Juices ──────────────────────────────────────────────
  { name: 'Fresh Orange',      th: 'น้ำส้มคั้นสด',        ru: 'Свежий апельсиновый сок', category: 'Juices', price: 80 },
  { name: 'Watermelon',        th: 'น้ำแตงโม',            ru: 'Арбузный сок',          category: 'Juices', price: 70 },
  { name: 'Detox Green Juice', th: 'น้ำผักดีท็อกซ์',      ru: 'Детокс зелёный сок',    category: 'Juices', price: 110 },
];

const exists = db.prepare('SELECT id FROM menu_items WHERE name = ? AND category = ?');
const insert = db.prepare(
  `INSERT INTO menu_items (name, name_th, name_ru, category, price, available, stock_quantity, low_stock_threshold)
   VALUES (?, ?, ?, ?, ?, 1, 50, 10)`
);

let added = 0;
let skipped = 0;
const run = db.transaction((items: SeedItem[]) => {
  for (const it of items) {
    if (exists.get(it.name, it.category)) {
      skipped++;
      continue;
    }
    insert.run(it.name, it.th, it.ru, it.category, it.price);
    added++;
  }
});
run(MENU);

const total = (db.prepare('SELECT COUNT(*) AS n FROM menu_items').get() as { n: number }).n;
console.log(`✓ Menu seed complete — added ${added}, skipped ${skipped} (already present). Menu now has ${total} items across ${new Set(MENU.map(m => m.category)).size} categories.`);
db.close();
