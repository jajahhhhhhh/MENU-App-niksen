/**
 * Seed the bar kitchen menu — Breakfast plates, Soups, Triangle Sandwiches
 * and Burritos.
 *
 *   npm run seed:bar
 *
 * Idempotent: inserts each dish if missing, otherwise refreshes its
 * descriptions (leaving price/availability alone so real prices aren't
 * clobbered). Nutrition info (kcal / protein) lives in the descriptions.
 * Burrito prices are the "from" (smallest size) price.
 */
import Database from 'better-sqlite3';

const db = new Database('pos.db');
db.pragma('busy_timeout = 5000');

// Make sure the columns exist even if run before the server applies migrations.
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

interface Dish {
  name: string;
  th: string;
  ru: string;
  category: string;
  price: number; // THB
  desc: string;
  desc_th: string;
  desc_ru: string;
}

const DISHES: Dish[] = [
  // ── Breakfast ───────────────────────────────────────────
  { name: 'English Breakfast', th: 'อิงลิชเบรกฟาสต์', ru: 'Английский завтрак',
    category: 'Breakfast', price: 210,
    desc: 'Big classic breakfast to start your day right — filling and satisfying. Eggs, sausage, bacon, baked beans, roast potatoes, tomatoes and toast. 689 kcal · 33 g protein.',
    desc_th: 'อาหารเช้าคลาสสิกจานใหญ่ เริ่มวันใหม่อย่างอิ่มอร่อย ไข่ดาว ไส้กรอก เบคอน ถั่วอบ มันฝรั่งอบ มะเขือเทศ และขนมปังปิ้ง 689 กิโลแคลอรี โปรตีน 33 กรัม',
    desc_ru: 'Большой классический завтрак — сытный и питательный. Яичница, колбаски, бекон, запечённая фасоль, картофель, томаты и тост. 689 ккал · 33 г белка.' },
  { name: 'Salmon Breakfast', th: 'แซลมอนเบรกฟาสต์', ru: 'Завтрак с лососем',
    category: 'Breakfast', price: 260,
    desc: 'Fresh and balanced breakfast with light, savory flavors. Scrambled eggs, salted salmon, roast potatoes, spinach, feta, olives and toast. 589 kcal · 26 g protein.',
    desc_th: 'อาหารเช้าสดใหม่และสมดุล รสชาติกลมกล่อม ไข่คน แซลมอนเค็ม มันฝรั่งอบ ผักโขม เฟต้าชีส มะกอก และขนมปังปิ้ง 589 กิโลแคลอรี โปรตีน 26 กรัม',
    desc_ru: 'Свежий сбалансированный завтрак с лёгким солоноватым вкусом. Яичница-болтунья, солёный лосось, картофель, шпинат, фета, оливки и тост. 589 ккал · 26 г белка.' },
  { name: 'Syrniki', th: 'ซีร์นิกิ', ru: 'Сырники',
    category: 'Breakfast', price: 190,
    desc: 'Golden, fluffy cheese pancakes with a creamy center, perfect with sour cream and mango sauce. 260 kcal · 11 g protein.',
    desc_th: 'แพนเค้กชีสสีทองเนื้อฟู ไส้นุ่มครีมมี เสิร์ฟกับซาวร์ครีมและซอสมะม่วง 260 กิโลแคลอรี โปรตีน 11 กรัม',
    desc_ru: 'Золотистые пышные сырники с нежной серединкой — идеальны со сметаной и манговым соусом. 260 ккал · 11 г белка.' },
  { name: 'Mediterranean Omelette', th: 'ออมเล็ตเมดิเตอร์เรเนียน', ru: 'Средиземноморский омлет',
    category: 'Breakfast', price: 195,
    desc: 'Fluffy eggs with tomatoes, mushrooms, bell peppers, broccoli and a fresh side salad, served with bread.',
    desc_th: 'ไข่ออมเล็ตเนื้อนุ่มกับมะเขือเทศ เห็ด พริกหวาน บรอกโคลี เสิร์ฟพร้อมสลัดสดและขนมปัง',
    desc_ru: 'Пышный омлет с томатами, грибами, болгарским перцем и брокколи, подаётся со свежим салатом и хлебом.' },
  { name: 'Shakshuka', th: 'ชัคชูก้า', ru: 'Шакшука',
    category: 'Breakfast', price: 165,
    desc: 'Eggs poached in a smoky, spiced tomato and pepper medley, served with bread.',
    desc_th: 'ไข่ดาวน้ำในซอสมะเขือเทศและพริกหวานปรุงเครื่องเทศกลิ่นรมควัน เสิร์ฟพร้อมขนมปัง',
    desc_ru: 'Яйца, томлённые в пряном томатно-перечном соусе с дымком, подаются с хлебом.' },
  { name: 'Avocado Breakfast', th: 'อะโวคาโดเบรกฟาสต์', ru: 'Завтрак с авокадо',
    category: 'Breakfast', price: 195,
    desc: 'Nourishing breakfast with a fresh, clean taste. Avocado, boiled eggs, corn, spinach, feta, olives, seeds and toast. 450 kcal · 16 g protein.',
    desc_th: 'อาหารเช้าสดชื่นรสสะอาด อะโวคาโด ไข่ต้ม ข้าวโพด ผักโขม เฟต้าชีส มะกอก เมล็ดพืช และขนมปังปิ้ง 450 กิโลแคลอรี โปรตีน 16 กรัม',
    desc_ru: 'Питательный завтрак со свежим, чистым вкусом. Авокадо, варёные яйца, кукуруза, шпинат, фета, оливки, семечки и тост. 450 ккал · 16 г белка.' },
  { name: 'Green Pesto Oats', th: 'โอ๊ตเพสโต้เขียว', ru: 'Овсянка с зелёным песто',
    category: 'Breakfast', price: 185,
    desc: 'Savory oats with green pesto, topped with creamy stracciatella and fresh basil. 379 kcal · 21 g protein.',
    desc_th: 'ข้าวโอ๊ตรสเค็มกับเพสโต้เขียว ท็อปด้วยสตราชาเทลลาครีมมีและใบโหระพาสด 379 กิโลแคลอรี โปรตีน 21 กรัม',
    desc_ru: 'Несладкая овсянка с зелёным песто, страчателлой и свежим базиликом. 379 ккал · 21 г белка.' },

  // ── Soups ───────────────────────────────────────────────
  { name: 'Pumpkin Soup', th: 'ซุปฟักทอง', ru: 'Тыквенный суп',
    category: 'Soups', price: 135,
    desc: 'Blended pumpkin, carrot, onion, potatoes and milk, served with a piece of bread. 300 ml · 77 kcal.',
    desc_th: 'ซุปฟักทองปั่นกับแครอท หัวหอม มันฝรั่ง และนม เสิร์ฟพร้อมขนมปัง 300 มล. 77 กิโลแคลอรี',
    desc_ru: 'Крем-суп из тыквы с морковью, луком, картофелем и молоком, подаётся с хлебом. 300 мл · 77 ккал.' },
  { name: 'Creamy Mushroom Soup', th: 'ซุปครีมเห็ด', ru: 'Грибной крем-суп',
    category: 'Soups', price: 135,
    desc: 'Craving something warm and comforting? This creamy mushroom soup is blended smooth and served with bread. 190 kcal.',
    desc_th: 'ซุปครีมเห็ดอุ่น ๆ เนื้อเนียนนุ่ม เสิร์ฟพร้อมขนมปัง 190 กิโลแคลอรี',
    desc_ru: 'Хочется чего-то тёплого и уютного? Нежный грибной крем-суп, подаётся с хлебом. 190 ккал.' },
  { name: 'Lentils Soup', th: 'ซุปถั่วเลนทิล', ru: 'Чечевичный суп',
    category: 'Soups', price: 160,
    desc: 'A smooth, blended soup made from lentils, carrots and onions, served with bread. 210 kcal · 11 g protein.',
    desc_th: 'ซุปถั่วเลนทิลปั่นเนียนกับแครอทและหัวหอม เสิร์ฟพร้อมขนมปัง 210 กิโลแคลอรี โปรตีน 11 กรัม',
    desc_ru: 'Нежный суп-пюре из чечевицы с морковью и луком, подаётся с хлебом. 210 ккал · 11 г белка.' },
  { name: 'Gazpacho – Cold Tomato Soup', th: 'กัสปาโช ซุปมะเขือเทศเย็น', ru: 'Гаспачо — холодный томатный суп',
    category: 'Soups', price: 130,
    desc: 'A refreshing cold tomato soup with vegetable concassé — perfect for a hot day.',
    desc_th: 'ซุปมะเขือเทศเย็นสดชื่นกับผักสับละเอียด เหมาะกับวันอากาศร้อน',
    desc_ru: 'Освежающий холодный томатный суп с овощным конкассе — идеален в жаркий день.' },

  // ── Triangle Sandwiches ─────────────────────────────────
  { name: 'Shrimp Triangle', th: 'แซนด์วิชสามเหลี่ยมกุ้ง', ru: 'Треугольный сэндвич с креветками',
    category: 'Triangle Sandwiches', price: 160,
    desc: 'Shrimp, brown rice, cream cheese and avocado wrapped in a soft tortilla. 241 kcal · 12 g protein.',
    desc_th: 'กุ้ง ข้าวกล้อง ครีมชีส และอะโวคาโด ห่อในแป้งตอร์ตียานุ่ม ๆ 241 กิโลแคลอรี โปรตีน 12 กรัม',
    desc_ru: 'Креветки, бурый рис, сливочный сыр и авокадо в мягкой тортилье. 241 ккал · 12 г белка.' },
  { name: 'Salmon Triangle Wrap', th: 'แซนด์วิชสามเหลี่ยมแซลมอน', ru: 'Треугольный ролл с лососем',
    category: 'Triangle Sandwiches', price: 160,
    desc: 'Fresh salmon, creamy avocado, cucumber and cheese, wrapped in a soft tortilla. 245 kcal.',
    desc_th: 'แซลมอนสด อะโวคาโดครีมมี แตงกวา และชีส ห่อในแป้งตอร์ตียานุ่ม ๆ 245 กิโลแคลอรี',
    desc_ru: 'Свежий лосось, нежное авокадо, огурец и сыр в мягкой тортилье. 245 ккал.' },

  // ── Burritos (price = smallest size, "from") ────────────
  { name: 'Bodybuilder Burrito', th: 'บอดี้บิลเดอร์เบอร์ริโต', ru: 'Бодибилдер-буррито',
    category: 'Burritos', price: 150,
    desc: 'Looking for a clean, protein-packed meal? A wrap with quinoa, chicken breast and fresh veggies. From 250 kcal, from ฿150.',
    desc_th: 'มื้อคลีนโปรตีนสูง แร็พไส้ควินัว อกไก่ และผักสด เริ่มต้น 250 กิโลแคลอรี ราคาเริ่มต้น 150 บาท',
    desc_ru: 'Чистая, богатая белком еда: ролл с киноа, куриной грудкой и свежими овощами. От 250 ккал, от ฿150.' },
  { name: 'Rainbow Burrito', th: 'เรนโบว์เบอร์ริโต', ru: 'Радужный буррито',
    category: 'Burritos', price: 150,
    desc: 'Fried chicken, raw beetroot, carrot, cucumber, cheese and greens rolled in a tortilla. From 308 kcal, from ฿150.',
    desc_th: 'ไก่ทอด บีทรูทสด แครอท แตงกวา ชีส และผักสด ห่อในตอร์ตียา เริ่มต้น 308 กิโลแคลอรี ราคาเริ่มต้น 150 บาท',
    desc_ru: 'Жареная курица, свежая свёкла, морковь, огурец, сыр и зелень в тортилье. От 308 ккал, от ฿150.' },
  { name: 'Richy Burrito', th: 'ริชชีเบอร์ริโต', ru: 'Ричи-буррито',
    category: 'Burritos', price: 170,
    desc: 'Salmon, avocado, brown rice, cherry tomatoes, mixed greens, seeds & sauce. From 160 kcal, from ฿170.',
    desc_th: 'แซลมอน อะโวคาโด ข้าวกล้อง มะเขือเทศเชอร์รี ผักรวม เมล็ดพืช และซอส เริ่มต้น 160 กิโลแคลอรี ราคาเริ่มต้น 170 บาท',
    desc_ru: 'Лосось, авокадо, бурый рис, черри, микс салатов, семечки и соус. От 160 ккал, от ฿170.' },
  { name: 'Vegetarian Burrito', th: 'เบอร์ริโตมังสวิรัติ', ru: 'Вегетарианский буррито',
    category: 'Burritos', price: 150,
    desc: 'Fresh mixed greens, brown rice, mushrooms, carrots, cucumber and cherry tomatoes in a tortilla. From 180 kcal, from ฿150.',
    desc_th: 'ผักรวมสด ข้าวกล้อง เห็ด แครอท แตงกวา และมะเขือเทศเชอร์รีในตอร์ตียา เริ่มต้น 180 กิโลแคลอรี ราคาเริ่มต้น 150 บาท',
    desc_ru: 'Свежий микс салатов, бурый рис, грибы, морковь, огурец и черри в тортилье. От 180 ккал, от ฿150.' },
];

const findItem = db.prepare('SELECT id FROM menu_items WHERE name = ? AND category = ?');
const insert = db.prepare(`
  INSERT INTO menu_items (name, name_th, name_ru, description, description_th, description_ru, category, price, available, stock_quantity, low_stock_threshold)
  VALUES (@name, @th, @ru, @desc, @desc_th, @desc_ru, @category, @price, 1, 50, 10)
`);
const update = db.prepare(`
  UPDATE menu_items SET name_th=@th, name_ru=@ru, description=@desc, description_th=@desc_th, description_ru=@desc_ru, available=1 WHERE id=@id
`);

let added = 0;
let updated = 0;
const run = db.transaction(() => {
  for (const d of DISHES) {
    const row = findItem.get(d.name, d.category) as { id: number } | undefined;
    if (row) {
      update.run({ ...d, id: row.id });
      updated++;
    } else {
      insert.run(d);
      added++;
    }
  }
});
run();

const total = (db.prepare(
  `SELECT COUNT(*) AS n FROM menu_items WHERE category IN ('Breakfast', 'Soups', 'Triangle Sandwiches', 'Burritos')`
).get() as { n: number }).n;
console.log(`✓ Bar kitchen seed complete — ${added} added, ${updated} refreshed (${total} items across Breakfast, Soups, Triangle Sandwiches & Burritos).`);
db.close();
