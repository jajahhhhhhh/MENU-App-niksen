/**
 * Seed the "Build Your Own Bowl" section — a ฿20 base bowl plus priced
 * add-on ingredients in seven groups (protein, vegetables, grains & noodles,
 * toppings, pickles, sauces, fruits). Customers compose a bowl by adding the
 * base and any ingredients to the cart.
 *
 *   npm run seed:bowl
 *
 * Idempotent: inserts each item if missing, otherwise refreshes names and
 * descriptions — price and availability are left alone on re-run.
 * Nutrition (kcal / protein / portion weight) lives in the descriptions.
 */
import Database from 'better-sqlite3';

const db = new Database('pos.db');
db.pragma('busy_timeout = 5000');

db.exec(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    available INTEGER DEFAULT 1,
    image_url TEXT,
    barcode TEXT,
    stock_quantity INTEGER DEFAULT 50,
    low_stock_threshold INTEGER DEFAULT 10,
    name_th TEXT,
    name_ru TEXT
  );
`);
for (const col of [
  'name_th TEXT', 'name_ru TEXT',
  'description TEXT', 'description_th TEXT', 'description_ru TEXT', 'image_url TEXT',
]) {
  try { db.exec(`ALTER TABLE menu_items ADD COLUMN ${col}`); } catch {}
}

const CATEGORY = 'Build Your Own Bowl';

// [name, name_th, name_ru, kcal, protein g, portion g, price ฿]
type Ingredient = [string, string, string, number, number, number, number];

interface Group {
  group: string;
  th: string;
  ru: string;
  items: Ingredient[];
}

const GROUPS: Group[] = [
  { group: 'Protein', th: 'โปรตีน', ru: 'Протеин', items: [
    ['Bacon', 'เบคอน', 'Бекон', 100, 2.0, 35, 45],
    ['Beef mince BBQ', 'เนื้อบดบาร์บีคิว', 'Говяжий фарш BBQ', 150, 13.0, 60, 95],
    ['Chicken fried', 'ไก่ทอด', 'Курица жареная', 197, 16.0, 80, 42],
    ['Chicken schnitzel', 'ชนิทเซิลไก่', 'Куриный шницель', 360, 30.0, 150, 100],
    ['Chicken sousvide', 'ไก่ซูวี', 'Курица су-вид', 132, 18.0, 80, 39],
    ['Egg boiled', 'ไข่ต้ม', 'Яйцо варёное', 78, 6.3, 50, 30],
    ['Falafel', 'ฟาลาเฟล', 'Фалафель', 333, 8.0, 100, 50],
    ['Kidney Bean', 'ถั่วแดง', 'Красная фасоль', 51, 3.5, 40, 25],
    ['Mushrooms', 'เห็ด', 'Грибы', 17, 1.3, 60, 27],
    ['Salmon cooked', 'แซลมอนสุก', 'Лосось запечённый', 144, 15.4, 70, 95],
    ['Salmon salted', 'แซลมอนเค็ม', 'Лосось солёный', 104, 10.2, 50, 65],
    ['Shrimp', 'กุ้ง', 'Креветки', 50, 12.0, 50, 48],
    ['Tofu crispy', 'เต้าหู้กรอบ', 'Тофу хрустящий', 175, 10.0, 80, 38],
    ['Tofu normal', 'เต้าหู้', 'Тофу', 86, 7.0, 60, 25],
    ['Tuna canned', 'ทูน่ากระป๋อง', 'Тунец консервированный', 58, 13.0, 50, 32],
  ]},
  { group: 'Vegetables', th: 'ผัก', ru: 'Овощи', items: [
    ['Beetroot', 'บีทรูท', 'Свёкла', 22, 0.8, 50, 28],
    ['Broccoli', 'บรอกโคลี', 'Брокколи', 18, 1.2, 50, 30],
    ['Carrot', 'แครอท', 'Морковь', 25, 0.5, 60, 28],
    ['Coleslaw', 'โคลสลอว์', 'Коул-слоу', 64, 1.5, 80, 35],
    ['Corn', 'ข้าวโพด', 'Кукуруза', 38, 1.4, 40, 28],
    ['Cucumber', 'แตงกวา', 'Огурец', 9, 0.4, 60, 28],
    ['Edamame', 'ถั่วแระญี่ปุ่น', 'Эдамаме', 48, 4.8, 40, 35],
    ['Green Peas', 'ถั่วลันเตา', 'Зелёный горошек', 34, 2.2, 40, 29],
    ['Mixed Greens', 'ผักสลัดรวม', 'Микс салатов', 8, 0.7, 50, 40],
    ['Potato', 'มันฝรั่ง', 'Картофель', 87, 1.9, 100, 35],
    ['Pumpkin', 'ฟักทอง', 'Тыква', 33, 0.9, 90, 30],
    ['Red Cabbage', 'กะหล่ำปลีแดง', 'Красная капуста', 16, 0.7, 50, 36],
    ['Spinach', 'ผักโขม', 'Шпинат', 26, 1.4, 40, 34],
    ['Tomatoes cherry', 'มะเขือเทศเชอร์รี', 'Помидоры черри', 7, 0.4, 40, 28],
    ['Zucchini', 'ซูกินี', 'Цукини', 8, 0.6, 50, 37],
  ]},
  { group: 'Grains & Noodles', th: 'ธัญพืชและเส้น', ru: 'Крупы и лапша', items: [
    ['Brown Rice', 'ข้าวกล้อง', 'Бурый рис', 111, 2.6, 100, 22],
    ['Buckwheat rice', 'ข้าวบัควีท', 'Гречка', 127, 3.4, 100, 31],
    ['Quinoa', 'ควินัว', 'Киноа', 120, 4.4, 100, 47],
    ['Soba', 'โซบะ', 'Соба', 129, 5.0, 130, 42],
    ['Udon', 'อุด้ง', 'Удон', 137, 3.4, 130, 41],
  ]},
  { group: 'Toppings', th: 'ท็อปปิ้ง', ru: 'Топпинги', items: [
    ['Bread', 'ขนมปัง', 'Хлеб', 132, 4.4, 50, 32],
    ['Feta', 'เฟต้าชีส', 'Фета', 53, 2.8, 20, 32],
    ['Goji', 'โกจิเบอร์รี', 'Годжи', 18, 0.7, 5, 15],
    ['Mix Nuts', 'ถั่วรวม', 'Микс орехов', 61, 2.0, 10, 25],
    ['Mix Seeds', 'เมล็ดพืชรวม', 'Микс семян', 57, 2.1, 10, 15],
    ['Nori', 'สาหร่ายโนริ', 'Нори', 7, 0.8, 2, 20],
    ['Olives', 'มะกอก', 'Оливки', 23, 0.2, 20, 35],
    ['Raisins', 'ลูกเกด', 'Изюм', 21, 0.2, 7, 20],
  ]},
  { group: 'Pickles', th: 'ผักดอง', ru: 'Соленья', items: [
    ['Ginger marinated', 'ขิงดอง', 'Имбирь маринованный', 24, 0.1, 40, 25],
    ['Korean Carrot', 'แครอทเกาหลี', 'Морковь по-корейски', 61, 0.4, 40, 35],
    ['Onion marinated', 'หอมดอง', 'Лук маринованный', 13, 0.2, 20, 17],
    ['Coleslaw Salad', 'สลัดโคลสลอว์', 'Салат коул-слоу', 85, 0.8, 50, 20],
  ]},
  { group: 'Sauces', th: 'ซอส', ru: 'Соусы', items: [
    ['Balsamic', 'บัลซามิก', 'Бальзамик', 9, 0.1, 10, 27],
    ['Cashew Sauce', 'ซอสเม็ดมะม่วงหิมพานต์', 'Кешью-соус', 74, 1.8, 40, 33],
    ['Garlic Sauce', 'ซอสกระเทียม', 'Чесночный соус', 71, 0.7, 40, 28],
    ['Hummus sauce', 'ซอสฮัมมูส', 'Хумус-соус', 99, 3.2, 40, 27],
    ['Mango Sauce', 'ซอสมะม่วง', 'Манговый соус', 62, 0.3, 40, 37],
    ['Olive Oil', 'น้ำมันมะกอก', 'Оливковое масло', 354, 0.0, 40, 36],
    ['Pesto', 'เพสโต้', 'Песто', 134, 2.0, 40, 42],
    ['Sesame Sauce', 'ซอสงา', 'Кунжутный соус', 108, 2.4, 40, 42],
    ['Sriracha Mayo', 'มาโยศรีราชา', 'Шрирача-майо', 144, 0.4, 40, 22],
  ]},
  { group: 'Fruits', th: 'ผลไม้', ru: 'Фрукты', items: [
    ['Avocado', 'อะโวคาโด', 'Авокадо', 80, 1.0, 50, 51],
    ['Mango', 'มะม่วง', 'Манго', 24, 0.3, 40, 45],
    ['Orange', 'ส้ม', 'Апельсин', 19, 0.4, 40, 32],
  ]},
];

interface Row {
  name: string; th: string; ru: string; price: number;
  desc: string; desc_th: string; desc_ru: string;
}

const ROWS: Row[] = [
  {
    name: 'BAR Bowl Base', th: 'โบวล์เบส', ru: 'Основа боула', price: 20,
    desc: 'Create your perfect bowl! Start with the base, then add any ingredients you like — mix and match for your ideal flavor.',
    desc_th: 'สร้างโบวล์ในแบบของคุณ! เริ่มจากเบส แล้วเลือกเพิ่มวัตถุดิบที่ชอบ ผสมผสานได้ตามใจ',
    desc_ru: 'Соберите свой идеальный боул! Начните с основы и добавьте любые ингредиенты по вкусу.',
  },
  ...GROUPS.flatMap(g => g.items.map(([name, th, ru, kcal, protein, grams, price]): Row => ({
    name, th, ru, price,
    desc: `Bowl add-on (${g.group}) — ${grams} g · ${kcal} kcal · ${protein} g protein`,
    desc_th: `ท็อปปิ้งโบวล์ (${g.th}) — ${grams} กรัม · ${kcal} กิโลแคลอรี · โปรตีน ${protein} กรัม`,
    desc_ru: `Добавка к боулу (${g.ru}) — ${grams} г · ${kcal} ккал · белок ${protein} г`,
  }))),
];

const findItem = db.prepare('SELECT id FROM menu_items WHERE name = ? AND category = ?');
const insert = db.prepare(`
  INSERT INTO menu_items (name, name_th, name_ru, description, description_th, description_ru, category, price, available, stock_quantity, low_stock_threshold)
  VALUES (@name, @th, @ru, @desc, @desc_th, @desc_ru, @category, @price, 1, 50, 10)
`);
const update = db.prepare(`
  UPDATE menu_items SET name_th=@th, name_ru=@ru, description=@desc, description_th=@desc_th, description_ru=@desc_ru WHERE id=@id
`);

let added = 0;
let updated = 0;
const run = db.transaction(() => {
  for (const r of ROWS) {
    const row = findItem.get(r.name, CATEGORY) as { id: number } | undefined;
    if (row) {
      update.run({ ...r, id: row.id });
      updated++;
    } else {
      insert.run({ ...r, category: CATEGORY });
      added++;
    }
  }
});
run();

const total = (db.prepare('SELECT COUNT(*) AS n FROM menu_items WHERE category = ?').get(CATEGORY) as { n: number }).n;
console.log(`✓ Build Your Own Bowl: ${added} added, ${updated} refreshed (${total} items — base + ${ROWS.length - 1} add-ons in ${GROUPS.length} groups).`);
db.close();
