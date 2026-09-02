/**
 * Ingredient stock, recipes and food cost.
 *
 * Four things the counter needs and the flat `menu_items.stock_quantity`
 * counter cannot give:
 *
 *   1. a recipe per dish (which ingredients, how much of each)
 *   2. what each dish actually costs to make, from real purchase prices
 *   3. purchase and expiry dates, so nothing quietly goes off in the fridge
 *   4. ingredient stock that falls automatically when a dish is sold
 *
 * Design notes worth keeping:
 *
 * - **Lots are the source of truth for stock.** On-hand is always
 *   `SUM(ingredient_lots.qty_remaining)`, never a cached column, so the number
 *   on screen cannot drift away from the purchases behind it.
 *
 * - **Cost is never faked.** An ingredient with no purchases and no manually
 *   entered cost reports `null`, and a dish containing it is marked
 *   `cost_complete: false`. A missing cost shown as ฿0 would print a 100%
 *   margin and quietly justify the wrong menu price — the single most
 *   expensive mistake this file could make.
 *
 * - **Selling is never blocked.** If stock runs out mid-service the sale still
 *   goes through; the shortfall is recorded as a movement with no lot attached
 *   and surfaced in the UI. A till that refuses a customer because a number in
 *   a database is stale is worse than a wrong number.
 */
import type BetterSqlite3 from 'better-sqlite3';
import express from 'express';

export type DB = BetterSqlite3.Database;

/** Base units. Bulk entry (kg/L) is converted to these in the UI. */
export const UNITS = ['g', 'ml', 'piece'] as const;

// How many base units are in one pack, when a shop sells the ingredient by
// pack rather than by weight — "1 pack = 300 g". Kept separate from `unit`
// so recipes stay written in grams and millilitres: a recipe asking for
// "1 pack" could not be costed once the pack size changed.
export function migratePackSize(db: DB) {
  try { db.exec('ALTER TABLE ingredients ADD COLUMN pack_size REAL'); } catch { /* already there */ }
  try { db.exec("ALTER TABLE ingredients ADD COLUMN pack_label TEXT"); } catch { /* already there */ }
}

export function initInventorySchema(db: DB) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      name                TEXT NOT NULL UNIQUE,
      name_th             TEXT,
      unit                TEXT NOT NULL DEFAULT 'g',
      -- Fallback cost per base unit, used only until a real purchase exists.
      default_cost        REAL,
      low_stock_threshold REAL NOT NULL DEFAULT 0,
      supplier            TEXT,
      active              INTEGER NOT NULL DEFAULT 1,
      created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- One row = one ingredient in one dish. Exactly one of menu_item_id /
    -- menu_option_id is set: options carry their own recipe so a built bowl
    -- costs what its chosen ingredients actually cost.
    CREATE TABLE IF NOT EXISTS recipe_items (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_item_id   INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
      menu_option_id INTEGER REFERENCES menu_options(id) ON DELETE CASCADE,
      ingredient_id  INTEGER NOT NULL REFERENCES ingredients(id),
      quantity       REAL NOT NULL,
      CHECK ((menu_item_id IS NULL) <> (menu_option_id IS NULL)),
      CHECK (quantity > 0)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_recipe_item
      ON recipe_items(menu_item_id, ingredient_id) WHERE menu_item_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_recipe_option
      ON recipe_items(menu_option_id, ingredient_id) WHERE menu_option_id IS NOT NULL;

    -- One row = one purchase. Expiry lives here, not on the ingredient,
    -- because two deliveries of the same thing expire on different days.
    CREATE TABLE IF NOT EXISTS ingredient_lots (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
      qty_purchased REAL NOT NULL,
      qty_remaining REAL NOT NULL,
      total_cost    REAL NOT NULL,
      purchased_on  TEXT NOT NULL,
      expires_on    TEXT,
      note          TEXT,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      CHECK (qty_purchased > 0)
    );
    CREATE INDEX IF NOT EXISTS idx_lots_ingredient ON ingredient_lots(ingredient_id);
    CREATE INDEX IF NOT EXISTS idx_lots_expiry ON ingredient_lots(expires_on) WHERE qty_remaining > 0;

    -- Audit trail. Every change to stock lands here, so "where did 3kg of
    -- chicken go" is always answerable.
    CREATE TABLE IF NOT EXISTS stock_movements (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
      lot_id        INTEGER REFERENCES ingredient_lots(id),
      delta         REAL NOT NULL,
      reason        TEXT NOT NULL,
      order_id      INTEGER,
      note          TEXT,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_movements_ingredient ON stock_movements(ingredient_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_movements_order ON stock_movements(order_id) WHERE order_id IS NOT NULL;
  `);

  // Older databases were created before pack sizes existed.
  migratePackSize(db);
}

// ---------------------------------------------------------------- costing ---

/**
 * Cost per base unit for every ingredient.
 *
 * Weighted average over stock still on hand — the standard way to value food
 * stock, and it stops one cheap bulk buy from flattering every dish for months.
 * Falls back to the most recent purchase (so an ingredient that has run out
 * still costs something), then to the manually entered `default_cost`, then to
 * null, which callers must treat as "unknown", never as zero.
 */
export function ingredientCosts(db: DB): Map<number, number | null> {
  const rows = db.prepare(`
    SELECT i.id, i.default_cost,
           (SELECT SUM(l.total_cost * l.qty_remaining / l.qty_purchased)
              FROM ingredient_lots l
             WHERE l.ingredient_id = i.id AND l.qty_remaining > 0)         AS on_hand_value,
           (SELECT SUM(l.qty_remaining)
              FROM ingredient_lots l
             WHERE l.ingredient_id = i.id AND l.qty_remaining > 0)         AS on_hand_qty,
           (SELECT l.total_cost / l.qty_purchased
              FROM ingredient_lots l
             WHERE l.ingredient_id = i.id
             ORDER BY l.purchased_on DESC, l.id DESC LIMIT 1)              AS last_unit_cost
      FROM ingredients i
  `).all() as any[];

  const out = new Map<number, number | null>();
  for (const r of rows) {
    if (r.on_hand_qty > 0 && r.on_hand_value != null) out.set(r.id, r.on_hand_value / r.on_hand_qty);
    else if (r.last_unit_cost != null) out.set(r.id, r.last_unit_cost);
    else if (r.default_cost != null) out.set(r.id, r.default_cost);
    else out.set(r.id, null);
  }
  return out;
}

export interface DishCost {
  menu_item_id: number;
  name: string;
  price: number;
  /** Null when the recipe is empty or any ingredient has no known cost. */
  cost: number | null;
  /** Cost of the ingredients that ARE priced — shown as a floor, not the truth. */
  partial_cost: number;
  has_recipe: boolean;
  cost_complete: boolean;
  /** Names of ingredients still missing a cost, so the UI can say which. */
  missing: string[];
  margin: number | null;
  margin_pct: number | null;
}

/** Cost every menu item from its recipe. Options are excluded — a built bowl's
 *  option cost depends on what the customer picked, so it is priced per order,
 *  not per menu row. */
export function dishCosts(db: DB): DishCost[] {
  const costs = ingredientCosts(db);
  const items = db.prepare('SELECT id, name, price FROM menu_items ORDER BY category, name').all() as any[];
  const recipe = db.prepare(`
    SELECT r.menu_item_id, r.ingredient_id, r.quantity, i.name
      FROM recipe_items r JOIN ingredients i ON i.id = r.ingredient_id
     WHERE r.menu_item_id IS NOT NULL
  `).all() as any[];

  const byItem = new Map<number, any[]>();
  for (const r of recipe) {
    if (!byItem.has(r.menu_item_id)) byItem.set(r.menu_item_id, []);
    byItem.get(r.menu_item_id)!.push(r);
  }

  return items.map(it => {
    const lines = byItem.get(it.id) || [];
    let partial = 0;
    const missing: string[] = [];
    for (const l of lines) {
      const c = costs.get(l.ingredient_id);
      if (c == null) missing.push(l.name);
      else partial += c * l.quantity;
    }
    const has_recipe = lines.length > 0;
    const complete = has_recipe && missing.length === 0;
    const cost = complete ? partial : null;
    return {
      menu_item_id: it.id,
      name: it.name,
      price: it.price,
      cost,
      partial_cost: partial,
      has_recipe,
      cost_complete: complete,
      missing,
      margin: cost == null ? null : it.price - cost,
      margin_pct: cost == null || it.price === 0 ? null : ((it.price - cost) / it.price) * 100,
    };
  });
}

// -------------------------------------------------------------- deduction ---

/** What one sold line needs: the dish's own recipe plus the recipe of every
 *  option the customer chose. */
function requirementsFor(db: DB, menuItemId: number, optionIds: number[], qty: number) {
  const need = new Map<number, number>();
  const add = (ingredientId: number, amount: number) =>
    need.set(ingredientId, (need.get(ingredientId) || 0) + amount);

  for (const r of db.prepare('SELECT ingredient_id, quantity FROM recipe_items WHERE menu_item_id = ?')
    .all(menuItemId) as any[]) add(r.ingredient_id, r.quantity * qty);

  if (optionIds.length) {
    const holes = optionIds.map(() => '?').join(',');
    for (const r of db.prepare(
      `SELECT ingredient_id, quantity FROM recipe_items WHERE menu_option_id IN (${holes})`
    ).all(...optionIds) as any[]) add(r.ingredient_id, r.quantity * qty);
  }
  return need;
}

/**
 * Take one line's ingredients out of stock, oldest-expiring lot first.
 *
 * Must be called inside the caller's transaction so a failure cannot leave an
 * order recorded with stock half-deducted.
 */
export function consumeForLine(
  db: DB, orderId: number | null, menuItemId: number, optionIds: number[], qty: number,
) {
  const need = requirementsFor(db, menuItemId, optionIds, qty);
  if (!need.size) return;

  // Nulls last: a lot with no expiry date should not jump the queue ahead of
  // one that is about to go off.
  const lotsFor = db.prepare(`
    SELECT id, qty_remaining FROM ingredient_lots
     WHERE ingredient_id = ? AND qty_remaining > 0
     ORDER BY (expires_on IS NULL), expires_on, purchased_on, id
  `);
  const takeFromLot = db.prepare('UPDATE ingredient_lots SET qty_remaining = qty_remaining - ? WHERE id = ?');
  const move = db.prepare(
    'INSERT INTO stock_movements (ingredient_id, lot_id, delta, reason, order_id, note) VALUES (?, ?, ?, ?, ?, ?)'
  );

  for (const [ingredientId, wanted] of need) {
    let left = wanted;
    for (const lot of lotsFor.all(ingredientId) as any[]) {
      if (left <= 0) break;
      const take = Math.min(left, lot.qty_remaining);
      takeFromLot.run(take, lot.id);
      move.run(ingredientId, lot.id, -take, 'sale', orderId, null);
      left -= take;
    }
    // Sold more than was ever recorded as bought. Record it rather than hide
    // it: it means a purchase went unlogged or a recipe quantity is wrong.
    if (left > 1e-9) {
      move.run(ingredientId, null, -left, 'shortfall', orderId,
        'sold beyond recorded stock — check purchases or recipe');
    }
  }
}

/** Undo an order's consumption when it is cancelled. Puts quantities back on
 *  the lots they came from, so expiry dates survive the round trip. */
export function restoreForOrder(db: DB, orderId: number) {
  const already = db.prepare(
    "SELECT COUNT(*) AS n FROM stock_movements WHERE order_id = ? AND reason = 'restock'"
  ).get(orderId) as any;
  if (already.n > 0) return; // already restored; cancelling twice must not double-credit

  const moves = db.prepare(
    "SELECT ingredient_id, lot_id, delta FROM stock_movements WHERE order_id = ? AND reason IN ('sale','shortfall')"
  ).all(orderId) as any[];
  if (!moves.length) return;

  const giveBack = db.prepare('UPDATE ingredient_lots SET qty_remaining = qty_remaining + ? WHERE id = ?');
  const move = db.prepare(
    'INSERT INTO stock_movements (ingredient_id, lot_id, delta, reason, order_id, note) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const m of moves) {
    const amount = -m.delta; // deltas were negative
    if (m.lot_id) giveBack.run(amount, m.lot_id);
    move.run(m.ingredient_id, m.lot_id, amount, 'restock', orderId, 'order cancelled');
  }
}

// ------------------------------------------------------------- csv import ---

/**
 * Minimal RFC4180 reader: quoted fields, embedded commas and newlines, ""
 * for a literal quote. Enough for a spreadsheet export, and small enough to
 * read — a dependency for this would be more surface than the feature.
 */
export function parseCsv(text: string): string[][] {
  // A BOM from Excel would otherwise become part of the first column name.
  const s = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }   // "" is one quote
        else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') { quoted = true; continue; }
    if (c === ',') { row.push(field); field = ''; continue; }
    if (c === '\r') continue;                            // CRLF from Windows
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

/**
 * How many base units one of the written unit is worth, or null if the unit
 * makes no sense for this ingredient — litres of something measured in grams
 * is a typo, and silently treating it as 1000 g would quietly wreck the cost.
 */
export function unitFactor(written: string, ing: { unit: string; pack_size?: number | null }): number | null {
  const u = written.trim().toLowerCase();
  const base = ing.unit;
  if (!u) return 1;   // blank means "already in the base unit"

  const same = {
    g: ['g', 'gram', 'grams', 'gr', 'กรัม', 'ก.'],
    ml: ['ml', 'millilitre', 'millilitres', 'milliliter', 'มล.', 'มิลลิลิตร'],
    piece: ['piece', 'pieces', 'pcs', 'pc', 'ea', 'ชิ้น', 'อัน', 'ฟอง', 'ใบ'],
  }[base as 'g' | 'ml' | 'piece'] || [];
  if (same.includes(u)) return 1;

  if (base === 'g' && ['kg', 'kilo', 'kilos', 'kilogram', 'kilograms', 'กก.', 'กิโล', 'กิโลกรัม'].includes(u)) return 1000;
  if (base === 'ml' && ['l', 'lt', 'litre', 'litres', 'liter', 'liters', 'ลิตร'].includes(u)) return 1000;

  // A pack only means something once someone has said how big one is.
  if (['pack', 'packs', 'pk', 'แพค', 'แพ็ค', 'ห่อ'].includes(u)) {
    return ing.pack_size && ing.pack_size > 0 ? ing.pack_size : null;
  }
  return null;
}

// ----------------------------------------------------------------- routes ---

export function inventoryRouter(db: DB) {
  const r = express.Router();

  const onHand = () => {
    const rows = db.prepare(`
      SELECT ingredient_id AS id, SUM(qty_remaining) AS qty
        FROM ingredient_lots GROUP BY ingredient_id
    `).all() as any[];
    const m = new Map<number, number>();
    for (const x of rows) m.set(x.id, x.qty);
    return m;
  };

  // Movements with no lot behind them: a shortfall when stock was over-sold,
  // and the matching credit if that order is later cancelled. Sum ALL of them
  // rather than filtering on reason — filtering to 'shortfall' alone would
  // count the debit but not its reversal, leaving an ingredient stuck negative
  // forever after a cancelled over-sale.
  const unbacked = () => {
    const rows = db.prepare(`
      SELECT ingredient_id AS id, SUM(delta) AS qty FROM stock_movements
       WHERE lot_id IS NULL GROUP BY ingredient_id
    `).all() as any[];
    const m = new Map<number, number>();
    for (const x of rows) m.set(x.id, x.qty);
    return m;
  };

  r.get('/ingredients', (_req, res) => {
    const costs = ingredientCosts(db);
    const stock = onHand();
    const short = unbacked();
    const rows = db.prepare('SELECT * FROM ingredients ORDER BY active DESC, name').all() as any[];
    res.json(rows.map(i => {
      const qty = (stock.get(i.id) || 0) + (short.get(i.id) || 0);
      return {
        ...i,
        unit_cost: costs.get(i.id) ?? null,
        on_hand: qty,
        stock_value: costs.get(i.id) != null ? qty * costs.get(i.id)! : null,
        low: qty <= i.low_stock_threshold,
      };
    }));
  });

  r.post('/ingredients', (req, res) => {
    const { name, name_th, unit, default_cost, low_stock_threshold, supplier, pack_size, pack_label } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'name is required' });
    if (unit && !UNITS.includes(unit)) return res.status(400).json({ error: `unit must be one of ${UNITS.join(', ')}` });
    try {
      const info = db.prepare(`
        INSERT INTO ingredients (name, name_th, unit, default_cost, low_stock_threshold, supplier, pack_size, pack_label)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(String(name).trim(), name_th || null, unit || 'g',
        default_cost === '' || default_cost == null ? null : Number(default_cost),
        Number(low_stock_threshold) || 0, supplier || null,
        pack_size === '' || pack_size == null ? null : Number(pack_size),
        pack_label || null);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'that ingredient already exists' });
      throw e;
    }
  });

  r.patch('/ingredients/:id', (req, res) => {
    const allowed = ['name', 'name_th', 'unit', 'default_cost', 'low_stock_threshold', 'supplier', 'active', 'pack_size', 'pack_label'];
    const sets: string[] = [], vals: any[] = [];
    for (const k of allowed) {
      if (!(k in (req.body || {}))) continue;
      if (k === 'unit' && !UNITS.includes(req.body[k])) return res.status(400).json({ error: 'bad unit' });
      sets.push(`${k} = ?`);
      vals.push(req.body[k] === '' ? null : req.body[k]);
    }
    if (!sets.length) return res.status(400).json({ error: 'nothing to update' });
    vals.push(req.params.id);
    db.prepare(`UPDATE ingredients SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
    res.json({ success: true });
  });

  r.delete('/ingredients/:id', (req, res) => {
    const id = Number(req.params.id);
    const used = db.prepare('SELECT COUNT(*) AS n FROM recipe_items WHERE ingredient_id = ?').get(id) as any;
    const bought = db.prepare('SELECT COUNT(*) AS n FROM ingredient_lots WHERE ingredient_id = ?').get(id) as any;
    // Deleting something with history would orphan recipes and movements, so
    // retire it instead — it drops out of the pickers but the past still reads.
    if (used.n > 0 || bought.n > 0) {
      db.prepare('UPDATE ingredients SET active = 0 WHERE id = ?').run(id);
      return res.json({ success: true, retired: true, used_in_recipes: used.n, lots: bought.n });
    }
    db.prepare('DELETE FROM ingredients WHERE id = ?').run(id);
    res.json({ success: true, deleted: true });
  });

  // ---- purchases -----------------------------------------------------------

  r.get('/lots', (req, res) => {
    const showEmpty = req.query.all === '1';
    res.json(db.prepare(`
      SELECT l.*, i.name AS ingredient_name, i.unit,
             l.total_cost / l.qty_purchased AS unit_cost,
             CAST(julianday(l.expires_on) - julianday('now') AS INTEGER) AS days_left
        FROM ingredient_lots l JOIN ingredients i ON i.id = l.ingredient_id
       ${showEmpty ? '' : 'WHERE l.qty_remaining > 0'}
       ORDER BY (l.expires_on IS NULL), l.expires_on, l.purchased_on DESC
    `).all());
  });

  r.post('/lots', (req, res) => {
    const { ingredient_id, qty, total_cost, purchased_on, expires_on, note } = req.body || {};
    const q = Number(qty), c = Number(total_cost);
    if (!ingredient_id) return res.status(400).json({ error: 'ingredient is required' });
    if (!(q > 0)) return res.status(400).json({ error: 'quantity must be more than 0' });
    if (!(c >= 0)) return res.status(400).json({ error: 'cost cannot be negative' });
    const bought = purchased_on || new Date().toISOString().slice(0, 10);
    if (expires_on && expires_on < bought) {
      return res.status(400).json({ error: 'expiry date is before the purchase date' });
    }
    const tx = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO ingredient_lots (ingredient_id, qty_purchased, qty_remaining, total_cost, purchased_on, expires_on, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(ingredient_id, q, q, c, bought, expires_on || null, note || null);
      db.prepare(
        'INSERT INTO stock_movements (ingredient_id, lot_id, delta, reason, note) VALUES (?, ?, ?, ?, ?)'
      ).run(ingredient_id, info.lastInsertRowid, q, 'purchase', note || null);
      return info.lastInsertRowid;
    });
    res.json({ id: tx() });
  });

  /**
   * Import a whole supplier bill from CSV.
   *
   * Typing a Tops delivery in one line at a time is how purchases stop being
   * recorded, and without purchases every dish cost is a guess. The columns
   * are the ones already in the template staff were given:
   *
   *   ingredient_name, amount, unit, total_paid_THB, bought_on, expires_on, note
   *
   * The file speaks the shop's language — kilos and litres and Thai ingredient
   * names — and this translates to what the table stores: an ingredient id and
   * a quantity in base units. Both happen here rather than in the browser so
   * one implementation decides what a row means.
   *
   * Nothing is written unless every row is good. A half-imported bill is worse
   * than a rejected one: you cannot tell which lines landed, and importing it
   * again to be sure doubles the stock that did.
   */
  r.post('/lots/import', (req, res) => {
    const csv = String(req.body?.csv ?? '');
    const commit = req.body?.commit === true;
    if (!csv.trim()) return res.status(400).json({ error: 'The file is empty.' });

    const rows = parseCsv(csv);
    if (rows.length === 0) return res.status(400).json({ error: 'No rows found in the file.' });

    // Match the header loosely: the template ships with units and hints in the
    // column names ("unit (g/ml/piece/kg/litre)"), and a spreadsheet round trip
    // adds its own punctuation.
    const header = rows[0].map(h => h.toLowerCase().replace(/﻿/g, '').trim());
    const col = (...names: string[]) => header.findIndex(h => names.some(n => h.startsWith(n)));
    const iName = col('ingredient_name', 'ingredient', 'ชื่อ');
    const iAmount = col('amount', 'qty', 'quantity', 'จำนวน');
    const iUnit = col('unit', 'หน่วย');
    const iCost = col('total_paid', 'total_cost', 'cost', 'ราคา', 'สุทธิ');
    const iDate = col('bought_on', 'purchased_on', 'date', 'วันที่');
    const iExpiry = col('expires_on', 'expiry', 'หมดอายุ');
    const iNote = col('note', 'หมายเหตุ');
    const missing = [
      iName < 0 && 'ingredient_name',
      iAmount < 0 && 'amount',
      iUnit < 0 && 'unit',
      iCost < 0 && 'total_paid_THB',
    ].filter(Boolean);
    if (missing.length) {
      return res.status(400).json({ error: `Missing column(s): ${missing.join(', ')}. Use the 03-purchases.csv template.` });
    }

    const ingredients = db.prepare('SELECT id, name, name_th, unit, pack_size FROM ingredients WHERE active = 1').all() as any[];
    const byName = new Map<string, any>();
    for (const ing of ingredients) {
      byName.set(ing.name.trim().toLowerCase(), ing);
      if (ing.name_th) byName.set(String(ing.name_th).trim().toLowerCase(), ing);
    }

    const today = new Date().toISOString().slice(0, 10);
    const out: any[] = [];
    let errors = 0;

    for (let i = 1; i < rows.length; i++) {
      const r0 = rows[i];
      // Trailing blank lines are what a spreadsheet leaves behind, not a mistake.
      if (r0.every(c => !c.trim())) continue;

      const line = i + 1;
      const rawName = (r0[iName] ?? '').trim();
      const cell = (idx: number) => (idx >= 0 ? (r0[idx] ?? '').trim() : '');
      const fail = (error: string) => { errors++; out.push({ line, name: rawName, error }); };

      if (!rawName) { fail('No ingredient name.'); continue; }
      const ing = byName.get(rawName.toLowerCase());
      if (!ing) { fail(`No ingredient called "${rawName}". Add it under Ingredients first.`); continue; }

      const amount = Number(cell(iAmount).replace(/,/g, ''));
      if (!(amount > 0)) { fail('Amount must be a number above 0.'); continue; }

      const unitRaw = cell(iUnit).toLowerCase();
      const factor = unitFactor(unitRaw, ing);
      if (factor == null) {
        fail(`Unit "${cell(iUnit)}" does not fit an ingredient measured in ${ing.unit}.`);
        continue;
      }

      const cost = Number(cell(iCost).replace(/[,฿\s]/g, ''));
      if (!(cost >= 0) || Number.isNaN(cost)) { fail('Total paid must be a number.'); continue; }

      const bought = cell(iDate) || today;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(bought)) { fail(`Date "${bought}" is not YYYY-MM-DD.`); continue; }
      const expires = cell(iExpiry);
      if (expires && !/^\d{4}-\d{2}-\d{2}$/.test(expires)) { fail(`Expiry "${expires}" is not YYYY-MM-DD.`); continue; }
      if (expires && expires < bought) { fail('Expiry date is before the purchase date.'); continue; }

      const qtyBase = amount * factor;
      out.push({
        line,
        name: ing.name,
        ingredient_id: ing.id,
        qty_base: qtyBase,
        base_unit: ing.unit,
        total_cost: cost,
        cost_per_unit: qtyBase > 0 ? cost / qtyBase : null,
        purchased_on: bought,
        expires_on: expires || null,
        note: cell(iNote) || null,
      });
    }

    const ready = out.filter(r => !r.error);
    if (!commit || errors > 0) {
      return res.json({ preview: true, rows: out, ready: ready.length, errors });
    }

    const insertLot = db.prepare(`
      INSERT INTO ingredient_lots (ingredient_id, qty_purchased, qty_remaining, total_cost, purchased_on, expires_on, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMove = db.prepare(
      'INSERT INTO stock_movements (ingredient_id, lot_id, delta, reason, note) VALUES (?, ?, ?, ?, ?)'
    );
    db.transaction(() => {
      for (const r0 of ready) {
        const info = insertLot.run(r0.ingredient_id, r0.qty_base, r0.qty_base, r0.total_cost, r0.purchased_on, r0.expires_on, r0.note);
        insertMove.run(r0.ingredient_id, info.lastInsertRowid, r0.qty_base, 'purchase', r0.note);
      }
    })();

    res.json({ preview: false, imported: ready.length, rows: out, errors: 0 });
  });

  /** Write off what went off or got spilled. */
  r.post('/lots/:id/waste', (req, res) => {
    const id = Number(req.params.id);
    const lot = db.prepare('SELECT * FROM ingredient_lots WHERE id = ?').get(id) as any;
    if (!lot) return res.status(404).json({ error: 'no such purchase' });
    const amount = req.body?.qty == null ? lot.qty_remaining : Number(req.body.qty);
    if (!(amount > 0)) return res.status(400).json({ error: 'quantity must be more than 0' });
    if (amount > lot.qty_remaining + 1e-9) {
      return res.status(400).json({ error: `only ${lot.qty_remaining} left in that purchase` });
    }
    db.transaction(() => {
      db.prepare('UPDATE ingredient_lots SET qty_remaining = qty_remaining - ? WHERE id = ?').run(amount, id);
      db.prepare(
        'INSERT INTO stock_movements (ingredient_id, lot_id, delta, reason, note) VALUES (?, ?, ?, ?, ?)'
      ).run(lot.ingredient_id, id, -amount, 'waste', req.body?.note || null);
    })();
    res.json({ success: true });
  });

  r.get('/expiring', (req, res) => {
    const days = Number(req.query.days ?? 7);
    res.json(db.prepare(`
      SELECT l.id, l.qty_remaining, l.expires_on, i.name AS ingredient_name, i.unit,
             CAST(julianday(l.expires_on) - julianday('now') AS INTEGER) AS days_left
        FROM ingredient_lots l JOIN ingredients i ON i.id = l.ingredient_id
       WHERE l.qty_remaining > 0 AND l.expires_on IS NOT NULL
         AND julianday(l.expires_on) - julianday('now') <= ?
       ORDER BY l.expires_on
    `).all(days));
  });

  // ---- recipes -------------------------------------------------------------

  r.get('/recipes/:menuItemId', (req, res) => {
    const id = Number(req.params.menuItemId);
    const costs = ingredientCosts(db);
    const lines = db.prepare(`
      SELECT r.id, r.ingredient_id, r.quantity, i.name, i.name_th, i.unit
        FROM recipe_items r JOIN ingredients i ON i.id = r.ingredient_id
       WHERE r.menu_item_id = ? ORDER BY i.name
    `).all(id) as any[];
    const item = db.prepare('SELECT id, name, price FROM menu_items WHERE id = ?').get(id) as any;
    res.json({
      item,
      lines: lines.map(l => ({
        ...l,
        unit_cost: costs.get(l.ingredient_id) ?? null,
        line_cost: costs.get(l.ingredient_id) != null ? costs.get(l.ingredient_id)! * l.quantity : null,
      })),
    });
  });

  r.post('/recipes/:menuItemId', (req, res) => {
    const menuItemId = Number(req.params.menuItemId);
    const { ingredient_id, quantity } = req.body || {};
    const q = Number(quantity);
    if (!ingredient_id) return res.status(400).json({ error: 'ingredient is required' });
    if (!(q > 0)) return res.status(400).json({ error: 'quantity must be more than 0' });
    // Adding the same ingredient twice means the cook changed their mind about
    // the amount, not that it goes in twice. The conflict target repeats the
    // partial index's WHERE clause — SQLite requires the match to be literal
    // for upserts against partial unique indexes.
    db.prepare(`
      INSERT INTO recipe_items (menu_item_id, ingredient_id, quantity) VALUES (?, ?, ?)
      ON CONFLICT (menu_item_id, ingredient_id) WHERE menu_item_id IS NOT NULL
      DO UPDATE SET quantity = excluded.quantity
    `).run(menuItemId, ingredient_id, q);
    res.json({ success: true });
  });

  r.delete('/recipes/line/:id', (req, res) => {
    db.prepare('DELETE FROM recipe_items WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // ---- reporting -----------------------------------------------------------

  r.get('/costs', (_req, res) => res.json(dishCosts(db)));

  r.get('/summary', (_req, res) => {
    const costs = ingredientCosts(db);
    const stock = onHand();
    const short = unbacked();
    let value = 0, unpriced = 0, negative = 0;
    for (const id of new Set([...stock.keys(), ...short.keys()])) {
      const qty = (stock.get(id) || 0) + (short.get(id) || 0);
      if (qty < 0) negative++;
      const c = costs.get(id);
      // Only stock actually on the shelf is worth anything; a negative balance
      // is a bookkeeping gap, not a liability to price.
      if (c == null) unpriced++; else value += Math.max(0, qty) * c;
    }
    const dishes = dishCosts(db);
    res.json({
      ingredients: db.prepare('SELECT COUNT(*) AS n FROM ingredients WHERE active = 1').get(),
      stock_value: value,
      ingredients_without_cost: unpriced,
      expiring_7d: (db.prepare(`
        SELECT COUNT(*) AS n FROM ingredient_lots
         WHERE qty_remaining > 0 AND expires_on IS NOT NULL
           AND julianday(expires_on) - julianday('now') <= 7
      `).get() as any).n,
      expired: (db.prepare(`
        SELECT COUNT(*) AS n FROM ingredient_lots
         WHERE qty_remaining > 0 AND expires_on IS NOT NULL AND expires_on < date('now')
      `).get() as any).n,
      // Ingredients whose balance is currently below zero — i.e. more was sold
      // than was ever recorded as bought. A count of past shortfall events
      // would keep alarming after the cause was corrected; this clears itself.
      ingredients_negative: negative,
      dishes_total: dishes.length,
      dishes_with_recipe: dishes.filter(d => d.has_recipe).length,
      dishes_costed: dishes.filter(d => d.cost_complete).length,
    });
  });

  r.get('/movements', (req, res) => {
    res.json(db.prepare(`
      SELECT m.*, i.name AS ingredient_name, i.unit
        FROM stock_movements m JOIN ingredients i ON i.id = m.ingredient_id
       ORDER BY m.created_at DESC, m.id DESC LIMIT ?
    `).all(Math.min(Number(req.query.limit ?? 100), 500)));
  });

  return r;
}
