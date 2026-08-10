/**
 * Build Your Own Bowl — a configurable menu item.
 *
 *   npm run seed:bowl
 *
 * Unlike every other item on the menu, this one is priced from a base plus
 * whatever the customer picks, so it needs option groups the flat menu_items
 * table can't express. Two new tables carry that, and order_items gains an
 * options snapshot so a receipt still reads correctly after prices change.
 *
 * Idempotent: re-running refreshes names, prices and nutrition in place and
 * leaves availability alone, so counter edits stick.
 */
import Database from 'better-sqlite3';

const db = new Database('pos.db');
db.pragma('busy_timeout = 5000');

const ITEM_NAME = 'Build Your Own Bowl';
const CATEGORY = 'Bowls';
const BASE_PRICE = 20;

interface Opt { name: string; price: number; kcal: number; protein: number; grams: number }
interface Group { name: string; name_th: string; name_ru: string; min: number; max: number | null; opts: Opt[] }

// price = the "+฿" surcharge; kcal / protein / grams are per portion as served.
const GROUPS: Group[] = [
  {
    name: 'Protein', name_th: 'โปรตีน', name_ru: 'Белок', min: 0, max: null,
    opts: [
      { name: 'Bacon',             price: 45,  kcal: 100, protein: 2.0,  grams: 35 },
      { name: 'Beef mince BBQ',    price: 95,  kcal: 150, protein: 13.0, grams: 60 },
      { name: 'Chicken fried',     price: 42,  kcal: 197, protein: 16.0, grams: 80 },
      { name: 'Chicken schnitzel', price: 100, kcal: 360, protein: 30.0, grams: 150 },
      { name: 'Chicken sousvide',  price: 39,  kcal: 132, protein: 18.0, grams: 80 },
      { name: 'Egg boiled',        price: 30,  kcal: 78,  protein: 6.3,  grams: 50 },
      { name: 'Falafel',           price: 50,  kcal: 333, protein: 8.0,  grams: 100 },
      { name: 'Kidney Bean',       price: 25,  kcal: 51,  protein: 3.5,  grams: 40 },
      { name: 'Mushrooms',         price: 27,  kcal: 17,  protein: 1.3,  grams: 60 },
      { name: 'Salmon cooked',     price: 95,  kcal: 144, protein: 15.4, grams: 70 },
      { name: 'Salmon salted',     price: 65,  kcal: 104, protein: 10.2, grams: 50 },
      { name: 'Shrimp',            price: 48,  kcal: 50,  protein: 12.0, grams: 50 },
      { name: 'Tofu crispy',       price: 38,  kcal: 175, protein: 10.0, grams: 80 },
      { name: 'Tofu normal',       price: 25,  kcal: 86,  protein: 7.0,  grams: 60 },
      { name: 'Tuna canned',       price: 32,  kcal: 58,  protein: 13.0, grams: 50 },
    ],
  },
  {
    name: 'Vegetables', name_th: 'ผัก', name_ru: 'Овощи', min: 0, max: null,
    opts: [
      { name: 'Beetroot',        price: 28, kcal: 22, protein: 0.8, grams: 50 },
      { name: 'Broccoli',        price: 30, kcal: 18, protein: 1.2, grams: 50 },
      { name: 'Carrot',          price: 28, kcal: 25, protein: 0.5, grams: 60 },
      { name: 'Coleslaw',        price: 35, kcal: 64, protein: 1.5, grams: 80 },
      { name: 'Corn',            price: 28, kcal: 38, protein: 1.4, grams: 40 },
      { name: 'Cucumber',        price: 28, kcal: 9,  protein: 0.4, grams: 60 },
      { name: 'Edamame',         price: 35, kcal: 48, protein: 4.8, grams: 40 },
      { name: 'Green Peas',      price: 29, kcal: 34, protein: 2.2, grams: 40 },
      { name: 'Mixed Greens',    price: 40, kcal: 8,  protein: 0.7, grams: 50 },
      { name: 'Potato',          price: 35, kcal: 87, protein: 1.9, grams: 100 },
      { name: 'Pumpkin',         price: 30, kcal: 33, protein: 0.9, grams: 90 },
      { name: 'Red Cabbage',     price: 36, kcal: 16, protein: 0.7, grams: 50 },
      { name: 'Spinach',         price: 34, kcal: 26, protein: 1.4, grams: 40 },
      { name: 'Tomatoes cherry', price: 28, kcal: 7,  protein: 0.4, grams: 40 },
      { name: 'Zucchini',        price: 37, kcal: 8,  protein: 0.6, grams: 50 },
    ],
  },
  {
    name: 'Grains & Noodles', name_th: 'ข้าวและเส้น', name_ru: 'Крупы и лапша', min: 0, max: null,
    opts: [
      { name: 'Brown Rice',     price: 22, kcal: 111, protein: 2.6, grams: 100 },
      { name: 'Buckwheat rice', price: 31, kcal: 127, protein: 3.4, grams: 100 },
      { name: 'Quinoa',         price: 47, kcal: 120, protein: 4.4, grams: 100 },
      { name: 'Soba',           price: 42, kcal: 129, protein: 5.0, grams: 130 },
      { name: 'Udon',           price: 41, kcal: 137, protein: 3.4, grams: 130 },
    ],
  },
  {
    name: 'Toppings', name_th: 'ท็อปปิ้ง', name_ru: 'Топпинги', min: 0, max: null,
    opts: [
      { name: 'Bread',     price: 32, kcal: 132, protein: 4.4, grams: 50 },
      { name: 'Feta',      price: 32, kcal: 53,  protein: 2.8, grams: 20 },
      { name: 'Goji',      price: 15, kcal: 18,  protein: 0.7, grams: 5 },
      { name: 'Mix Nuts',  price: 25, kcal: 61,  protein: 2.0, grams: 10 },
      { name: 'Mix Seeds', price: 15, kcal: 57,  protein: 2.1, grams: 10 },
      { name: 'Nori',      price: 20, kcal: 7,   protein: 0.8, grams: 2 },
      { name: 'Olives',    price: 35, kcal: 23,  protein: 0.2, grams: 20 },
      { name: 'Raisins',   price: 20, kcal: 21,  protein: 0.2, grams: 7 },
    ],
  },
  {
    name: 'Pickles', name_th: 'ของดอง', name_ru: 'Соленья', min: 0, max: null,
    opts: [
      { name: 'Ginger marinated', price: 25, kcal: 24, protein: 0.1, grams: 40 },
      { name: 'Korean Carrot',    price: 35, kcal: 61, protein: 0.4, grams: 40 },
      { name: 'Onion marinated',  price: 17, kcal: 13, protein: 0.2, grams: 20 },
      { name: 'Coleslaw Salad',   price: 20, kcal: 85, protein: 0.8, grams: 50 },
    ],
  },
  {
    name: 'Sauces', name_th: 'ซอส', name_ru: 'Соусы', min: 0, max: null,
    opts: [
      { name: 'Balsamic',      price: 27, kcal: 9,   protein: 0.1, grams: 10 },
      { name: 'Cashew Sauce',  price: 33, kcal: 74,  protein: 1.8, grams: 40 },
      { name: 'Garlic Sauce',  price: 28, kcal: 71,  protein: 0.7, grams: 40 },
      { name: 'Hummus sauce',  price: 27, kcal: 99,  protein: 3.2, grams: 40 },
      { name: 'Mango Sauce',   price: 37, kcal: 62,  protein: 0.3, grams: 40 },
      { name: 'Olive Oil',     price: 36, kcal: 354, protein: 0.0, grams: 40 },
      { name: 'Pesto',         price: 42, kcal: 134, protein: 2.0, grams: 40 },
      { name: 'Sesame Sauce',  price: 42, kcal: 108, protein: 2.4, grams: 40 },
      { name: 'Sriracha Mayo', price: 22, kcal: 144, protein: 0.4, grams: 40 },
    ],
  },
  {
    name: 'Fruits', name_th: 'ผลไม้', name_ru: 'Фрукты', min: 0, max: null,
    opts: [
      { name: 'Avocado', price: 51, kcal: 80, protein: 1.0, grams: 50 },
      { name: 'Mango',   price: 45, kcal: 24, protein: 0.3, grams: 40 },
      { name: 'Orange',  price: 32, kcal: 19, protein: 0.4, grams: 40 },
    ],
  },
];

// ---- schema ----------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS menu_option_groups (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item_id INTEGER NOT NULL,
    name         TEXT NOT NULL,
    name_th      TEXT,
    name_ru      TEXT,
    min_select   INTEGER NOT NULL DEFAULT 0,
    max_select   INTEGER,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    UNIQUE(menu_item_id, name),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
  );
  CREATE TABLE IF NOT EXISTS menu_options (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id   INTEGER NOT NULL,
    name       TEXT NOT NULL,
    name_th    TEXT,
    name_ru    TEXT,
    price      REAL NOT NULL DEFAULT 0,
    kcal       INTEGER,
    protein    REAL,
    grams      INTEGER,
    available  INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE(group_id, name),
    FOREIGN KEY (group_id) REFERENCES menu_option_groups(id)
  );
  CREATE INDEX IF NOT EXISTS idx_option_groups_item ON menu_option_groups(menu_item_id);
  CREATE INDEX IF NOT EXISTS idx_options_group ON menu_options(group_id);
`);

// A receipt must still read correctly after an option's price or name changes,
// so the chosen options are snapshotted onto the order line, the same reasoning
// as price_at_time.
try { db.exec('ALTER TABLE order_items ADD COLUMN options_json TEXT'); } catch {}

// ---- the parent item -------------------------------------------------------
let item = db.prepare('SELECT id FROM menu_items WHERE name = ?').get(ITEM_NAME) as { id: number } | undefined;
if (!item) {
  const info = db.prepare(`
    INSERT INTO menu_items (name, name_th, name_ru, description, description_th, description_ru,
                            category, price, available, stock_quantity, low_stock_threshold)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 999, 10)
  `).run(
    ITEM_NAME, 'สร้างโบวล์ของคุณเอง', 'Собери свой боул',
    'Choose any ingredients you like — mix and match for your ideal bowl.',
    'เลือกส่วนผสมที่ชอบได้เลย ผสมกันตามใจ ให้ได้โบวล์ในแบบของคุณ',
    'Выберите любые ингредиенты — соберите идеальный боул.',
    CATEGORY, BASE_PRICE,
  );
  item = { id: Number(info.lastInsertRowid) };
  console.log(`✓ สร้างเมนู "${ITEM_NAME}" (ฐาน ฿${BASE_PRICE})`);
} else {
  db.prepare('UPDATE menu_items SET price = ? WHERE id = ?').run(BASE_PRICE, item.id);
  console.log(`· เมนู "${ITEM_NAME}" มีอยู่แล้ว (id ${item.id})`);
}

// ---- groups + options ------------------------------------------------------
const upsertGroup = db.prepare(`
  INSERT INTO menu_option_groups (menu_item_id, name, name_th, name_ru, min_select, max_select, sort_order)
  VALUES (@item, @name, @name_th, @name_ru, @min, @max, @sort)
  ON CONFLICT(menu_item_id, name) DO UPDATE SET
    name_th = excluded.name_th, name_ru = excluded.name_ru,
    min_select = excluded.min_select, max_select = excluded.max_select,
    sort_order = excluded.sort_order
`);
const getGroup = db.prepare('SELECT id FROM menu_option_groups WHERE menu_item_id = ? AND name = ?');
// Availability is left out of the update so sold-out flags set at the counter survive.
const upsertOption = db.prepare(`
  INSERT INTO menu_options (group_id, name, price, kcal, protein, grams, sort_order)
  VALUES (@group, @name, @price, @kcal, @protein, @grams, @sort)
  ON CONFLICT(group_id, name) DO UPDATE SET
    price = excluded.price, kcal = excluded.kcal, protein = excluded.protein,
    grams = excluded.grams, sort_order = excluded.sort_order
`);

let groupCount = 0, optCount = 0;
db.transaction(() => {
  GROUPS.forEach((g, gi) => {
    upsertGroup.run({ item: item!.id, name: g.name, name_th: g.name_th, name_ru: g.name_ru,
                      min: g.min, max: g.max, sort: gi });
    const row = getGroup.get(item!.id, g.name) as { id: number };
    groupCount++;
    g.opts.forEach((o, oi) => {
      upsertOption.run({ group: row.id, name: o.name, price: o.price,
                         kcal: o.kcal, protein: o.protein, grams: o.grams, sort: oi });
      optCount++;
    });
  });
})();

console.log(`✓ ${groupCount} หมวด · ${optCount} ตัวเลือก`);
const cheapest = BASE_PRICE;
const dearest = BASE_PRICE + GROUPS.reduce((sum, g) => sum + Math.max(...g.opts.map(o => o.price)), 0);
console.log(`  ราคา: ฿${cheapest} (ไม่ใส่อะไรเลย) ถึง ฿${dearest} (เลือกของแพงสุดทุกหมวด)`);
for (const g of GROUPS) {
  const prices = g.opts.map(o => o.price);
  console.log(`  ${g.name.padEnd(18)} ${String(g.opts.length).padStart(2)} ตัวเลือก  ฿${Math.min(...prices)}–${Math.max(...prices)}`);
}
db.close();
