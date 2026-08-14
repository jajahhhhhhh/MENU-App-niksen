/**
 * Exercises the parts of inventory.ts that are easy to get wrong: FIFO by
 * expiry, weighted-average costing, over-selling, and cancel/restore.
 *
 *   npx tsx test-inventory.ts
 *
 * Runs against a throwaway database, never pos.db.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import { initInventorySchema, ingredientCosts, dishCosts, consumeForLine, restoreForOrder } from './inventory.ts';

const FILE = 'test-inventory.tmp.db';
fs.rmSync(FILE, { force: true });
const db = new Database(FILE);

db.exec(`
  CREATE TABLE menu_items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, category TEXT, price REAL);
  CREATE TABLE menu_option_groups (id INTEGER PRIMARY KEY AUTOINCREMENT, menu_item_id INTEGER, name TEXT);
  CREATE TABLE menu_options (id INTEGER PRIMARY KEY AUTOINCREMENT, group_id INTEGER, name TEXT);
`);
initInventorySchema(db);

let failures = 0;
const near = (a: any, b: number) => Math.abs(Number(a) - b) < 1e-6;
function check(label: string, got: any, want: any) {
  const ok = typeof want === 'number' ? near(got, want) : JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? '  ✓' : '  ✗'} ${label}${ok ? '' : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
  if (!ok) failures++;
}
const onHand = (id: number) => {
  const lots = (db.prepare('SELECT COALESCE(SUM(qty_remaining),0) q FROM ingredient_lots WHERE ingredient_id=?').get(id) as any).q;
  // Same definition the API uses: every lot-less movement, whatever the reason,
  // so a shortfall and its later reversal cancel out.
  const short = (db.prepare("SELECT COALESCE(SUM(delta),0) q FROM stock_movements WHERE ingredient_id=? AND lot_id IS NULL").get(id) as any).q;
  return lots + short;
};

// --- fixtures ---------------------------------------------------------------
const item = db.prepare("INSERT INTO menu_items (name, category, price) VALUES ('Test Sando','Food',160)").run().lastInsertRowid as number;
const grp = db.prepare('INSERT INTO menu_option_groups (menu_item_id, name) VALUES (?,?)').run(item, 'Extras').lastInsertRowid as number;
const optAvo = db.prepare('INSERT INTO menu_options (group_id, name) VALUES (?,?)').run(grp, 'Extra avocado').lastInsertRowid as number;

const bread = db.prepare("INSERT INTO ingredients (name, unit) VALUES ('Bread','g')").run().lastInsertRowid as number;
const avo = db.prepare("INSERT INTO ingredients (name, unit) VALUES ('Avocado','g')").run().lastInsertRowid as number;
const salt = db.prepare("INSERT INTO ingredients (name, unit, default_cost) VALUES ('Salt','g',0.05)").run().lastInsertRowid as number;

const addLot = (ing: number, qty: number, cost: number, bought: string, exp: string | null) =>
  db.prepare('INSERT INTO ingredient_lots (ingredient_id, qty_purchased, qty_remaining, total_cost, purchased_on, expires_on) VALUES (?,?,?,?,?,?)')
    .run(ing, qty, qty, cost, bought, exp).lastInsertRowid as number;

console.log('\nFIFO takes the soonest expiry first, not the oldest purchase');
// Bought earlier but expires LATER — must be used second.
const breadLate = addLot(bread, 1000, 100, '2026-08-01', '2026-08-30'); // ฿0.10/g
const breadSoon = addLot(bread, 500, 75, '2026-08-05', '2026-08-14');   // ฿0.15/g
db.prepare('INSERT INTO recipe_items (menu_item_id, ingredient_id, quantity) VALUES (?,?,?)').run(item, bread, 120);
consumeForLine(db, 1, item, [], 1);
check('soon-to-expire lot drawn down', (db.prepare('SELECT qty_remaining q FROM ingredient_lots WHERE id=?').get(breadSoon) as any).q, 380);
check('later lot untouched', (db.prepare('SELECT qty_remaining q FROM ingredient_lots WHERE id=?').get(breadLate) as any).q, 1000);

console.log('\nCost is a weighted average of what is actually on the shelf');
// 380g @ ฿0.15 + 1000g @ ฿0.10 = ฿57+฿100 = ฿157 over 1380g
check('weighted unit cost', ingredientCosts(db).get(bread), 157 / 1380);

console.log('\nAn ingredient with no purchases falls back to its typed-in cost');
check('default_cost used', ingredientCosts(db).get(salt), 0.05);

console.log('\nAn ingredient with no cost at all reports null, never zero');
check('unknown cost is null', ingredientCosts(db).get(avo), null);

console.log('\nA dish containing an unpriced ingredient is not costed');
db.prepare('INSERT INTO recipe_items (menu_item_id, ingredient_id, quantity) VALUES (?,?,?)').run(item, avo, 50);
let d = dishCosts(db)[0];
check('cost withheld', d.cost, null);
check('flagged incomplete', d.cost_complete, false);
check('names the culprit', d.missing, ['Avocado']);
check('partial cost still shown', near(d.partial_cost, (157 / 1380) * 120), true);

console.log('\nOnce priced, margin appears');
addLot(avo, 1000, 300, '2026-08-10', '2026-08-20'); // ฿0.30/g
d = dishCosts(db)[0];
const wantCost = ingredientCosts(db).get(bread)! * 120 + 0.30 * 50;
check('cost complete', d.cost_complete, true);
check('cost', d.cost, wantCost);
check('margin', d.margin, 160 - wantCost);

console.log('\nOptions add their own ingredients');
db.prepare('INSERT INTO recipe_items (menu_option_id, ingredient_id, quantity) VALUES (?,?,?)').run(optAvo, avo, 30);
const avoBefore = onHand(avo);
consumeForLine(db, 2, item, [optAvo], 1);
check('dish 50g + option 30g came off', avoBefore - onHand(avo), 80);

console.log('\nSelling past the recorded stock is allowed but recorded');
const left = onHand(avo);
consumeForLine(db, 3, item, [], Math.ceil((left + 100) / 50));
const short = db.prepare("SELECT COUNT(*) n FROM stock_movements WHERE reason='shortfall' AND ingredient_id=?").get(avo) as any;
check('shortfall recorded', short.n > 0, true);
check('on-hand went negative, not clamped to 0', onHand(avo) < 0, true);

console.log('\nCancelling an order puts the ingredients back');
const beforeCancel = onHand(bread);
const order4Bread = 120 * 2;
consumeForLine(db, 4, item, [], 2);
check('taken', beforeCancel - onHand(bread), order4Bread);
restoreForOrder(db, 4);
check('given back', onHand(bread), beforeCancel);

console.log('\nCancelling twice must not credit twice');
restoreForOrder(db, 4);
check('still the same', onHand(bread), beforeCancel);

console.log('\nRe-adding an ingredient to a recipe updates the amount (upsert against the partial index)');
// The exact SQL the POST /recipes route runs — a plain ON CONFLICT without the
// index's WHERE clause throws "does not match any PRIMARY KEY or UNIQUE
// constraint" here, which the direct INSERTs above never exercise.
const upsert = db.prepare(`
  INSERT INTO recipe_items (menu_item_id, ingredient_id, quantity) VALUES (?, ?, ?)
  ON CONFLICT (menu_item_id, ingredient_id) WHERE menu_item_id IS NOT NULL
  DO UPDATE SET quantity = excluded.quantity
`);
upsert.run(item, bread, 999);
check('amount replaced, not duplicated',
  db.prepare('SELECT COUNT(*) n FROM recipe_items WHERE menu_item_id=? AND ingredient_id=?').get(item, bread),
  { n: 1 });
check('new amount stored',
  db.prepare('SELECT quantity q FROM recipe_items WHERE menu_item_id=? AND ingredient_id=?').get(item, bread),
  { q: 999 });

db.close();
fs.rmSync(FILE, { force: true });
console.log(failures ? `\n✗ ${failures} check(s) failed\n` : '\n✓ all checks passed\n');
process.exit(failures ? 1 : 0);
