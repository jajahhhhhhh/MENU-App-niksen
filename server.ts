import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { orderingOpen } from "./src/config.ts";
import { SqliteSessionStore } from "./sessionStore.ts";
import { initInventorySchema, inventoryRouter, consumeForLine, restoreForOrder } from "./inventory.ts";

const db = new Database("pos.db");

// Initialize database
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
    low_stock_threshold INTEGER DEFAULT 10
  );

  CREATE TABLE IF NOT EXISTS staff_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT DEFAULT 'clocked_out',
    current_shift_start DATETIME
  );

  CREATE TABLE IF NOT EXISTS staff_shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id INTEGER NOT NULL,
    staff_name TEXT NOT NULL,
    role TEXT NOT NULL,
    clock_in DATETIME NOT NULL,
    clock_out DATETIME,
    hours_worked REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    points INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'Silver',
    total_spent REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    notes TEXT,
    discount_type TEXT,
    discount_value REAL DEFAULT 0,
    member_id INTEGER REFERENCES members(id),
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_time REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Alter orders and menu_items tables safely for existing databases
try { db.exec("ALTER TABLE orders ADD COLUMN member_id INTEGER REFERENCES members(id)"); } catch (e) {}
try { db.exec("ALTER TABLE orders ADD COLUMN points_earned INTEGER DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE orders ADD COLUMN points_redeemed INTEGER DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE menu_items ADD COLUMN barcode TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE menu_items ADD COLUMN stock_quantity INTEGER DEFAULT 50"); } catch (e) {}
try { db.exec("ALTER TABLE menu_items ADD COLUMN low_stock_threshold INTEGER DEFAULT 10"); } catch (e) {}

// Online-ordering columns for existing databases
try { db.exec("ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'dine_in'"); } catch (e) {}
try { db.exec("ALTER TABLE orders ADD COLUMN customer_name TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE orders ADD COLUMN customer_phone TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE orders ADD COLUMN delivery_address TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE menu_items ADD COLUMN name_th TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE menu_items ADD COLUMN name_ru TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE menu_items ADD COLUMN description TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE menu_items ADD COLUMN description_th TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE menu_items ADD COLUMN description_ru TEXT"); } catch (e) {}

// Populate initial barcodes if missing
db.exec(`
  UPDATE menu_items SET barcode = '88500000' || PRINTF('%02d', id) WHERE barcode IS NULL OR barcode = '';
  UPDATE menu_items SET stock_quantity = 45 WHERE stock_quantity IS NULL;
  UPDATE menu_items SET low_stock_threshold = 10 WHERE low_stock_threshold IS NULL;
`);

// Configurable items carry option groups the flat menu_items table can't
// express. Created here so the server starts cleanly on an empty database;
// staff fill them in from the menu editor.
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
// Chosen options are snapshotted onto the line so a receipt still reads
// correctly after an option is renamed, repriced or removed.
try { db.exec("ALTER TABLE order_items ADD COLUMN options_json TEXT"); } catch (e) {}

// Ingredient stock, recipes and food cost. Declared after menu_items and
// menu_options because recipe_items references both.
initInventorySchema(db);

// Default settings (change PIN and PromptPay ID in Manage → Store Settings)
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("staff_pin", "1234");
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("shop_name", "Niksen");
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("promptpay_id", "");

// ---- PromptPay QR payload (EMVCo) ----
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function promptPayPayload(target: string, amount: number): string | null {
  const digits = (target || "").replace(/[^0-9]/g, "");
  if (!digits) return null;
  const f = (id: string, value: string) => id + String(value.length).padStart(2, "0") + value;
  const account = digits.length >= 13
    ? f("02", digits) // national ID / tax ID
    : f("01", "0066" + digits.replace(/^0/, "")); // mobile number
  const merchant = f("29", f("00", "A000000677010111") + account);
  let payload =
    f("00", "01") + f("01", "12") + merchant + f("53", "764") +
    f("54", amount.toFixed(2)) + f("58", "TH") + "6304";
  return payload + crc16(payload);
}

// ---- Menu photos ----------------------------------------------------------
// Photos used to be stored inside menu_items.image_url as a base64 data URL,
// which meant every customer downloaded every photo inline with the menu JSON
// on every visit: one dish with a picture already made that response 102 KB,
// and a browser cannot cache an image embedded in JSON separately from it.
//
// They are files now. The name carries a hash of the bytes, so a changed photo
// is a changed URL and the old one can be cached forever without ever going
// stale. The directory sits next to pos.db rather than in dist/, which a
// deploy rebuilds, or public/, which is only copied at build time.
const PHOTO_DIR = path.join(process.cwd(), "photos");
const PHOTO_URL = "/menu-photos";

function storeMenuPhoto(dataUrl: string, menuItemId: number): string | null {
  const m = /^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(dataUrl);
  if (!m) return null;
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length === 0) return null;
  // The editor re-encodes every upload as JPEG; anything else is something we
  // did not write, so keep its own extension rather than mislabelling it.
  const ext = m[1].toLowerCase() === "jpeg" ? "jpg" : m[1].toLowerCase().replace(/[^a-z0-9]/g, "");
  const hash = crypto.createHash("sha256").update(bytes).digest("hex").slice(0, 12);
  const file = `${menuItemId}-${hash}.${ext || "jpg"}`;
  fs.mkdirSync(PHOTO_DIR, { recursive: true });
  fs.writeFileSync(path.join(PHOTO_DIR, file), bytes);
  return `${PHOTO_URL}/${file}`;
}

// Replacing or deleting a dish should not leave its old picture on the disk
// for ever. Only files we wrote are touched, and never the one still in use.
function forgetMenuPhoto(url: unknown, keep?: string | null) {
  if (typeof url !== "string" || !url.startsWith(`${PHOTO_URL}/`)) return;
  if (keep && url === keep) return;
  const file = path.basename(url);
  try {
    fs.unlinkSync(path.join(PHOTO_DIR, file));
  } catch {
    /* already gone, or never written — nothing to clean up */
  }
}

// One-off move for photos uploaded before this change. Runs at boot, does
// nothing on a database that has none, and leaves the row alone if the write
// fails so a full disk cannot blank a menu photo.
function migrateInlinePhotos() {
  const rows = db.prepare("SELECT id, image_url FROM menu_items WHERE image_url LIKE 'data:%'").all() as any[];
  if (rows.length === 0) return;
  const update = db.prepare("UPDATE menu_items SET image_url = ? WHERE id = ?");
  let moved = 0;
  for (const row of rows) {
    const stored = storeMenuPhoto(row.image_url, row.id);
    if (stored) { update.run(stored, row.id); moved++; }
  }
  console.log(`Moved ${moved} inline menu photo(s) out of the database into ${PHOTO_DIR}`);
}
migrateInlinePhotos();

// ---- Live order feed -------------------------------------------------------
// Until now the POS learned about a customer's QR order only when someone
// happened to reload the page, so an order could sit unseen for as long as the
// till was left open. Each open till holds one long-lived stream, and every
// write to the orders table is announced on it.
type LiveClient = { res: express.Response };
const liveClients = new Set<LiveClient>();

function broadcast(event: string, data: Record<string, unknown>) {
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of liveClients) {
    // One till closing its laptop mid-write must not take the others down.
    try {
      client.res.write(frame);
    } catch {
      liveClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  // Behind a reverse proxy (Caddy/nginx) in production → bind localhost only;
  // in dev bind all interfaces so you can test from a phone on the same WiFi.
  const HOST = process.env.HOST || (process.env.NODE_ENV === "production" ? "127.0.0.1" : "0.0.0.0");

  const SESSION_SECRET = process.env.SESSION_SECRET || "niksen-pos-secret";
  if (process.env.NODE_ENV === "production" && SESSION_SECRET === "niksen-pos-secret") {
    throw new Error(
      "Refusing to start in production without a strong SESSION_SECRET. " +
      "Set the SESSION_SECRET env var — generate one with: openssl rand -hex 32",
    );
  }

  app.set("trust proxy", 1);
  // Menu photos are sent inline as base64 data URLs (there is no upload
  // endpoint), so the default 100kb JSON limit rejected any real photo.
  app.use(express.json({ limit: "10mb" }));
  app.use(cookieParser());
  app.use(session({
    // Sessions live in SQLite, not in process memory: staff stay logged in
    // across deploys and restarts, and nothing accumulates in the heap.
    store: new SqliteSessionStore(db),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      maxAge: 12 * 60 * 60 * 1000, // a shift's length — re-login next day
      // secure cookies only when served over HTTPS (production behind a proxy)
      secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
      sameSite: 'lax',
      httpOnly: true,
    }
  }));

  // ---- Staff authentication (PIN) ----
  app.post("/api/auth/login", (req, res) => {
    const { pin } = req.body || {};
    const row = db.prepare("SELECT value FROM settings WHERE key = 'staff_pin'").get() as any;
    if (row && typeof pin === "string" && pin === row.value) {
      ((req as any).session).authed = true;
      return res.json({ success: true });
    }
    res.status(401).json({ error: "Incorrect PIN" });
  });

  app.post("/api/auth/logout", (req, res) => {
    ((req as any).session).destroy(() => res.json({ success: true }));
  });

  app.get("/api/auth/me", (req, res) => {
    res.json({ authed: !!((req as any).session)?.authed });
  });

  // Everything under /api requires staff login, except auth + public customer endpoints
  app.use("/api", (req, res, next) => {
    if (((req as any).session)?.authed) return next();
    if (req.path.startsWith("/auth/") || req.path.startsWith("/public/")) return next();
    return res.status(401).json({ error: "Unauthorized" });
  });

  // ---- Public customer-facing endpoints ----
  app.get("/api/public/info", (req, res) => {
    const get = (k: string) => (db.prepare("SELECT value FROM settings WHERE key = ?").get(k) as any)?.value || "";
    res.json({ shop_name: get("shop_name") || "Niksen", promptpay_enabled: !!get("promptpay_id") });
  });

  app.get("/api/public/menu", (req, res) => {
    const items = db.prepare(
      "SELECT id, name, name_th, name_ru, description, description_th, description_ru, category, price, image_url, stock_quantity FROM menu_items WHERE available = 1"
    ).all() as any[];

    // Attach option groups to the few items that are configurable. Fetched in
    // two flat queries and stitched in memory rather than per-item, so adding
    // more configurable items later doesn't turn this into N+1 round trips.
    const groups = db.prepare(
      "SELECT id, menu_item_id, name, name_th, name_ru, min_select, max_select FROM menu_option_groups ORDER BY sort_order, id"
    ).all() as any[];
    const options = db.prepare(
      "SELECT id, group_id, name, name_th, name_ru, price, kcal, protein, grams FROM menu_options WHERE available = 1 ORDER BY sort_order, id"
    ).all() as any[];

    const optionsByGroup = new Map<number, any[]>();
    for (const o of options) {
      if (!optionsByGroup.has(o.group_id)) optionsByGroup.set(o.group_id, []);
      optionsByGroup.get(o.group_id)!.push(o);
    }
    const groupsByItem = new Map<number, any[]>();
    for (const g of groups) {
      const opts = optionsByGroup.get(g.id) || [];
      if (opts.length === 0) continue; // an empty group is noise in the UI
      if (!groupsByItem.has(g.menu_item_id)) groupsByItem.set(g.menu_item_id, []);
      groupsByItem.get(g.menu_item_id)!.push({ ...g, options: opts });
    }

    res.json(items.map(i => ({
      ...i,
      in_stock: i.stock_quantity === null || i.stock_quantity > 0,
      option_groups: groupsByItem.get(i.id) || null,
    })));
  });

  app.post("/api/public/orders", (req, res) => {
    if (!orderingOpen()) return res.status(403).json({ error: "Online ordering opens 18 August 2026." });
    const { items, order_type, customer_name, customer_phone, delivery_address, notes } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "Cart is empty" });
    if (order_type !== "pickup" && order_type !== "delivery") return res.status(400).json({ error: "Invalid order type" });
    if (!customer_name || !customer_phone) return res.status(400).json({ error: "Name and phone are required" });
    if (order_type === "delivery" && !delivery_address) return res.status(400).json({ error: "Delivery address is required" });
    const phone = String(customer_phone).replace(/[^0-9]/g, "");
    if (phone.length < 9 || phone.length > 15) return res.status(400).json({ error: "Invalid phone number" });

    // Prices always come from the database — never from the client
    const getItem = db.prepare("SELECT * FROM menu_items WHERE id = ? AND available = 1");
    // An option is only valid for the item whose group it belongs to — without
    // the join a caller could attach a ฿0 option from another item, or a
    // sold-out one, and the price would still come out looking legitimate.
    const getOption = db.prepare(`
      SELECT o.id, o.name, o.price, o.kcal, o.protein,
             g.id AS group_id, g.name AS group_name
      FROM menu_options o
      JOIN menu_option_groups g ON g.id = o.group_id
      WHERE o.id = ? AND g.menu_item_id = ? AND o.available = 1
    `);
    // How many choices each group requires. The rule is set in the POS and
    // shown on the ordering page, so it has to hold here too: a cart assembled
    // by anything other than our own page would otherwise skip a required
    // choice and arrive as a bowl with no base.
    const getGroups = db.prepare(
      "SELECT id, name, min_select, max_select FROM menu_option_groups WHERE menu_item_id = ?",
    );
    let subtotal = 0;
    const validated: { id: number; quantity: number; price: number; options: any[] | null }[] = [];
    for (const it of items) {
      const qty = Math.floor(Number(it.quantity));
      if (!Number.isFinite(qty) || qty < 1 || qty > 50) return res.status(400).json({ error: "Invalid quantity" });
      const menuItem = getItem.get(it.menu_item_id) as any;
      if (!menuItem) return res.status(400).json({ error: "An item in your cart is no longer available" });
      if (menuItem.stock_quantity !== null && menuItem.stock_quantity < qty) {
        return res.status(400).json({ error: `Not enough stock for ${menuItem.name}` });
      }

      // Option prices are looked up server-side for the same reason item prices
      // are: the client sends ids only, never amounts.
      let unitPrice = menuItem.price;
      let chosen: any[] | null = null;
      // Tallied while resolving, so the group rules below can be checked
      // without re-reading what was stored for the receipt.
      const pickedByGroup = new Map<number, number>();
      if (Array.isArray(it.options) && it.options.length > 0) {
        if (it.options.length > 60) return res.status(400).json({ error: "Too many options selected" });
        const seen = new Set<number>();
        chosen = [];
        for (const rawId of it.options) {
          const optId = Math.floor(Number(rawId));
          if (!Number.isFinite(optId) || seen.has(optId)) continue; // ignore junk and duplicates
          seen.add(optId);
          const opt = getOption.get(optId, menuItem.id) as any;
          if (!opt) return res.status(400).json({ error: "An option in your cart is no longer available" });
          pickedByGroup.set(opt.group_id, (pickedByGroup.get(opt.group_id) || 0) + 1);
          chosen.push({ id: opt.id, group: opt.group_name, name: opt.name, price: opt.price, kcal: opt.kcal, protein: opt.protein });
          unitPrice += opt.price;
        }
        if (chosen.length === 0) chosen = null;
      }

      // Check the per-group rules once the whole line is known, so the message
      // names the group the customer still has to answer.
      const groups = getGroups.all(menuItem.id) as any[];
      if (groups.length > 0) {
        for (const g of groups) {
          const n = pickedByGroup.get(g.id) || 0;
          if (n < g.min_select) {
            return res.status(400).json({
              error: g.min_select === 1
                ? `Choose a ${g.name.toLowerCase()} for ${menuItem.name}.`
                : `Choose at least ${g.min_select} from ${g.name} for ${menuItem.name}.`,
            });
          }
          if (g.max_select !== null && n > g.max_select) {
            return res.status(400).json({
              error: `Choose at most ${g.max_select} from ${g.name} for ${menuItem.name}.`,
            });
          }
        }
      }

      // price_at_time carries base + options so receipts, totals and the POS
      // keep working off a single unit price, as they did before options existed.
      validated.push({ id: menuItem.id, quantity: qty, price: unitPrice, options: chosen });
      subtotal += unitPrice * qty;
    }
    const total = subtotal * 1.07; // 7% tax, same rule as in-store
    const pointsEarned = Math.floor(total / 50);

    const transaction = db.transaction(() => {
      // Find or create the member by phone — online orders always earn points
      let member = db.prepare("SELECT * FROM members WHERE phone = ?").get(phone) as any;
      if (!member) {
        const r = db.prepare(
          "INSERT INTO members (name, phone, email, points, tier, total_spent) VALUES (?, ?, '', 50, 'Silver', 0)"
        ).run(String(customer_name).slice(0, 100), phone);
        member = db.prepare("SELECT * FROM members WHERE id = ?").get(r.lastInsertRowid);
      }

      const orderResult = db.prepare(`
        INSERT INTO orders (table_number, status, notes, discount_value, member_id, points_earned, points_redeemed,
                            order_type, customer_name, customer_phone, delivery_address)
        VALUES (0, 'open', ?, 0, ?, ?, 0, ?, ?, ?, ?)
      `).run(
        notes ? String(notes).slice(0, 500) : null,
        member.id, pointsEarned, order_type,
        String(customer_name).slice(0, 100), phone,
        order_type === "delivery" ? String(delivery_address).slice(0, 300) : null
      );
      const orderId = orderResult.lastInsertRowid;

      const insertItem = db.prepare("INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time, options_json) VALUES (?, ?, ?, ?, ?)");
      const deductStock = db.prepare("UPDATE menu_items SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ?");
      for (const v of validated) {
        insertItem.run(orderId, v.id, v.quantity, v.price, v.options ? JSON.stringify(v.options) : null);
        deductStock.run(v.quantity, v.id);
        // Ingredients come off the shelf too, following the dish's recipe and
        // the recipes of whichever options were chosen. Inside this same
        // transaction, so an order can never be recorded half-deducted.
        consumeForLine(db, Number(orderId), v.id, (v.options || []).map((o: any) => o.id), v.quantity);
      }

      const newSpent = member.total_spent + total;
      let newTier = "Silver";
      if (newSpent >= 5000) newTier = "Platinum";
      else if (newSpent >= 2000) newTier = "Gold";
      db.prepare("UPDATE members SET total_spent = ?, points = points + ?, tier = ? WHERE id = ?")
        .run(newSpent, pointsEarned, newTier, member.id);

      return { orderId, memberPoints: member.points + pointsEarned };
    });

    const { orderId, memberPoints } = transaction();
    // Announce only once the transaction has committed — a till that reloaded
    // on a rolled-back order would show one that does not exist.
    broadcast("order.new", { id: orderId, source: "online" });
    const ppId = (db.prepare("SELECT value FROM settings WHERE key = 'promptpay_id'").get() as any)?.value || "";
    res.json({
      id: orderId,
      total,
      points_earned: pointsEarned,
      member_points: memberPoints,
      promptpay: ppId ? promptPayPayload(ppId, total) : null,
    });
  });

  app.get("/api/public/orders/:id/status", (req, res) => {
    const order = db.prepare("SELECT id, status, order_type, created_at FROM orders WHERE id = ?").get(req.params.id) as any;
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  });

  // API Routes
  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsMap = settings.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(settingsMap);
  });

  app.post("/api/settings", (req, res) => {
    const allowed = ["shop_name", "promptpay_id", "staff_pin", "shop_phone", "shop_address"];
    const upsert = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === "staff_pin" && !/^\d{4,8}$/.test(String(req.body[key]))) {
          return res.status(400).json({ error: "PIN must be 4-8 digits" });
        }
        upsert.run(key, String(req.body[key]));
      }
    }
    res.json({ success: true });
  });

  // Google OAuth Endpoints
  app.get("/api/auth/google/url", (req, res) => {
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/business.manage',
      access_type: 'offline',
      prompt: 'consent'
    });
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/google/callback`;

    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      const tokens = await tokenResponse.json();
      if (tokens.access_token) {
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run("google_access_token", tokens.access_token);
        if (tokens.refresh_token) {
          db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run("google_refresh_token", tokens.refresh_token);
        }
      }

      res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f5f5f4;">
            <div style="text-align: center; background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
              <h2 style="color: #10b981;">Connected Successfully!</h2>
              <p style="color: #78716c;">Your Google Business Profile is now linked.</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                  window.close();
                } else {
                  window.location.href = '/pos';
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Google OAuth Error:", error);
      res.status(500).send("Authentication failed");
    }
  });
  app.get("/api/menu", (req, res) => {
    const items = db.prepare("SELECT * FROM menu_items").all();
    res.json(items);
  });

  // The POS form posts whatever is in its fields. An empty price arrives as
  // null (parseFloat("") is NaN, and JSON.stringify turns NaN into null) and
  // used to hit a NOT NULL constraint, surfacing as a 500 with no useful
  // message. An empty name or category was accepted outright and produced a
  // blank row on the customer menu. Validate before touching the database.
  const validateMenuFields = (body: any): string | null => {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return "Item name is required.";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    if (!category) return "Category is required.";
    const price = Number(body.price);
    if (body.price === null || body.price === undefined || body.price === "" || !Number.isFinite(price)) {
      return "Price is required and must be a number.";
    }
    if (price < 0) return "Price cannot be negative.";
    return null;
  };

  app.post("/api/menu", (req, res) => {
    const invalid = validateMenuFields(req.body);
    if (invalid) return res.status(400).json({ error: invalid });
    const { name, name_th, name_ru, description, description_th, description_ru, category, price, image_url, barcode, stock_quantity, low_stock_threshold } = req.body;
    const barcodeVal = barcode || `88500000${Math.floor(Math.random() * 90 + 10)}`;
    const stockVal = stock_quantity !== undefined ? stock_quantity : 50;
    const lowVal = low_stock_threshold !== undefined ? low_stock_threshold : 10;
    const result = db.prepare("INSERT INTO menu_items (name, name_th, name_ru, description, description_th, description_ru, category, price, image_url, barcode, stock_quantity, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(name, name_th || null, name_ru || null, description || null, description_th || null, description_ru || null, category, price, image_url, barcodeVal, stockVal, lowVal);
    const newId = Number(result.lastInsertRowid);
    // The editor sends the photo inline; the file it becomes is named after the
    // item, so this can only happen once the row exists.
    if (typeof image_url === "string" && image_url.startsWith("data:")) {
      const stored = storeMenuPhoto(image_url, newId);
      if (stored) db.prepare("UPDATE menu_items SET image_url = ? WHERE id = ?").run(stored, newId);
    }
    res.json({ id: newId });
  });

  app.patch("/api/menu/:id", (req, res) => {
    const { name, name_th, name_ru, description, description_th, description_ru, category, price, available, image_url, barcode, stock_quantity, low_stock_threshold } = req.body;
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name);
    }
    if (name_th !== undefined) {
      updates.push("name_th = ?");
      params.push(name_th || null);
    }
    if (name_ru !== undefined) {
      updates.push("name_ru = ?");
      params.push(name_ru || null);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      params.push(description || null);
    }
    if (description_th !== undefined) {
      updates.push("description_th = ?");
      params.push(description_th || null);
    }
    if (description_ru !== undefined) {
      updates.push("description_ru = ?");
      params.push(description_ru || null);
    }
    if (category !== undefined) {
      updates.push("category = ?");
      params.push(category);
    }
    if (price !== undefined) {
      updates.push("price = ?");
      params.push(price);
    }
    if (available !== undefined) {
      updates.push("available = ?");
      params.push(available ? 1 : 0);
    }
    let replacedPhoto: string | null = null;
    if (image_url !== undefined) {
      let value = image_url;
      if (typeof image_url === "string" && image_url.startsWith("data:")) {
        const stored = storeMenuPhoto(image_url, Number(req.params.id));
        // A photo that cannot be written is not a reason to lose the rest of
        // the edit, so fall back to leaving the old one in place.
        if (stored) {
          value = stored;
          const prev = db.prepare("SELECT image_url FROM menu_items WHERE id = ?").get(req.params.id) as any;
          replacedPhoto = prev?.image_url ?? null;
        } else {
          value = undefined as any;
        }
      }
      if (value !== undefined) {
        updates.push("image_url = ?");
        params.push(value);
      }
    }
    if (barcode !== undefined) {
      updates.push("barcode = ?");
      params.push(barcode);
    }
    if (stock_quantity !== undefined) {
      updates.push("stock_quantity = ?");
      params.push(stock_quantity);
    }
    if (low_stock_threshold !== undefined) {
      updates.push("low_stock_threshold = ?");
      params.push(low_stock_threshold);
    }

    if (updates.length > 0) {
      params.push(req.params.id);
      db.prepare(`UPDATE menu_items SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    // Only once the row actually points at the new file.
    forgetMenuPhoto(replacedPhoto);
    }

    res.json({ success: true });
  });

  app.delete("/api/menu/:id", (req, res) => {
    const id = Number(req.params.id);
    // image_url comes along so the photo file can be cleaned up after the row.
    const item = db.prepare("SELECT id, name, image_url FROM menu_items WHERE id = ?").get(id) as any;
    if (!item) return res.status(404).json({ error: "not_found" });
    // Items referenced by past orders can't be hard-deleted (order_items FK +
    // receipt history) — hide them from the menu instead and say so.
    const used = db.prepare("SELECT COUNT(*) AS n FROM order_items WHERE menu_item_id = ?").get(id) as any;
    if (used.n > 0) {
      db.prepare("UPDATE menu_items SET available = 0 WHERE id = ?").run(id);
      return res.json({ success: true, hidden: true, order_lines: used.n });
    }
    // Option groups belong to the item, so they go with it. Without this the
    // FK on menu_option_groups.menu_item_id aborts the delete, and a
    // customisable item (the bowl builder, any item with add-ons) could never
    // be removed. recipe_items handles itself — it is ON DELETE CASCADE.
    try {
      db.transaction(() => {
        db.prepare(
          "DELETE FROM menu_options WHERE group_id IN (SELECT id FROM menu_option_groups WHERE menu_item_id = ?)"
        ).run(id);
        db.prepare("DELETE FROM menu_option_groups WHERE menu_item_id = ?").run(id);
        db.prepare("DELETE FROM menu_items WHERE id = ?").run(id);
      })();
      // The row is gone, so nothing can point at its picture any more.
      forgetMenuPhoto(item.image_url);
    } catch (err: any) {
      // Something else still points at this row. Hiding it keeps the menu
      // usable and beats a 500 that the UI can only report as "try again".
      db.prepare("UPDATE menu_items SET available = 0 WHERE id = ?").run(id);
      return res.status(409).json({
        error: `"${item.name}" is still referenced elsewhere, so it has been marked Sold Out and hidden from customer ordering instead.`,
        hidden: true,
      });
    }
    res.json({ success: true, deleted: true });
  });

  // ---- Menu option groups ---------------------------------------------------
  // A configurable dish — a build-your-own bowl, a coffee with a milk choice —
  // is described by groups of options. Until now nothing but a seed script
  // could create them, so the one configurable item on the live menu went out
  // with nothing for a customer to choose.
  //
  // What a customer picked is snapshotted into order_items.options_json at the
  // time of the order, not referenced by id, so editing or removing an option
  // later cannot rewrite a receipt that has already been printed.

  const optionGroupsFor = (menuItemId: number) => {
    const groups = db.prepare(`
      SELECT id, menu_item_id, name, name_th, name_ru, min_select, max_select, sort_order
        FROM menu_option_groups WHERE menu_item_id = ? ORDER BY sort_order, id
    `).all(menuItemId) as any[];
    // One flat query for the options rather than one per group: a bowl builder
    // has a dozen groups and this is on the path of every menu edit.
    const options = db.prepare(`
      SELECT id, group_id, name, name_th, name_ru, price, kcal, protein, grams, available, sort_order
        FROM menu_options
       WHERE group_id IN (SELECT id FROM menu_option_groups WHERE menu_item_id = ?)
       ORDER BY sort_order, id
    `).all(menuItemId) as any[];
    const byGroup = new Map<number, any[]>();
    for (const o of options) {
      if (!byGroup.has(o.group_id)) byGroup.set(o.group_id, []);
      byGroup.get(o.group_id)!.push({ ...o, available: !!o.available });
    }
    return groups.map(g => ({ ...g, options: byGroup.get(g.id) || [] }));
  };

  // min/max describe how many of a group's options a customer must pick. Left
  // blank, max means "no limit" — that is a real choice for a toppings list,
  // so it is stored as NULL rather than coerced to a number.
  const readSelectRange = (body: any, fallbackMin = 0) => {
    const rawMin = body.min_select;
    const min = rawMin === undefined || rawMin === null || rawMin === ""
      ? fallbackMin
      : Math.floor(Number(rawMin));
    const rawMax = body.max_select;
    const max = rawMax === undefined || rawMax === null || rawMax === ""
      ? null
      : Math.floor(Number(rawMax));
    if (!Number.isFinite(min) || min < 0) return { error: "Minimum choices must be 0 or more." };
    if (max !== null && (!Number.isFinite(max) || max < 1)) return { error: "Maximum choices must be 1 or more, or blank for no limit." };
    if (max !== null && max < min) return { error: "Maximum choices cannot be lower than the minimum." };
    return { min, max };
  };

  app.get("/api/menu/:id/option-groups", (req, res) => {
    const item = db.prepare("SELECT id FROM menu_items WHERE id = ?").get(req.params.id);
    if (!item) return res.status(404).json({ error: "That menu item no longer exists." });
    res.json(optionGroupsFor(Number(req.params.id)));
  });

  app.post("/api/menu/:id/option-groups", (req, res) => {
    const item = db.prepare("SELECT id FROM menu_items WHERE id = ?").get(req.params.id) as any;
    if (!item) return res.status(404).json({ error: "That menu item no longer exists." });
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ error: "A choice group needs a name." });
    const range = readSelectRange(req.body);
    if ("error" in range) return res.status(400).json({ error: range.error });
    const nextOrder = (db.prepare(
      "SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM menu_option_groups WHERE menu_item_id = ?"
    ).get(item.id) as any).n;
    try {
      const r = db.prepare(`
        INSERT INTO menu_option_groups (menu_item_id, name, name_th, name_ru, min_select, max_select, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(item.id, name, req.body.name_th || null, req.body.name_ru || null, range.min, range.max, nextOrder);
      res.json({ id: r.lastInsertRowid });
    } catch {
      // UNIQUE(menu_item_id, name) — two groups called "Size" on one dish would
      // read as a bug to whoever met it on the ordering page.
      res.status(409).json({ error: `This item already has a choice group called "${name}".` });
    }
  });

  app.patch("/api/option-groups/:groupId", (req, res) => {
    const group = db.prepare("SELECT * FROM menu_option_groups WHERE id = ?").get(req.params.groupId) as any;
    if (!group) return res.status(404).json({ error: "That choice group no longer exists." });
    const updates: string[] = [];
    const params: any[] = [];
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ error: "A choice group needs a name." });
      updates.push("name = ?"); params.push(name);
    }
    for (const field of ["name_th", "name_ru"]) {
      if (req.body[field] !== undefined) { updates.push(`${field} = ?`); params.push(req.body[field] || null); }
    }
    if (req.body.min_select !== undefined || req.body.max_select !== undefined) {
      const range = readSelectRange(
        { min_select: req.body.min_select ?? group.min_select, max_select: req.body.max_select ?? group.max_select },
        group.min_select,
      );
      if ("error" in range) return res.status(400).json({ error: range.error });
      updates.push("min_select = ?", "max_select = ?"); params.push(range.min, range.max);
    }
    if (updates.length === 0) return res.json({ success: true });
    params.push(group.id);
    try {
      db.prepare(`UPDATE menu_option_groups SET ${updates.join(", ")} WHERE id = ?`).run(...params);
      res.json({ success: true });
    } catch {
      res.status(409).json({ error: "Another choice group on this item already has that name." });
    }
  });

  app.delete("/api/option-groups/:groupId", (req, res) => {
    const group = db.prepare("SELECT * FROM menu_option_groups WHERE id = ?").get(req.params.groupId) as any;
    if (!group) return res.status(404).json({ error: "That choice group no longer exists." });
    // Options carry their own recipe lines; recipe_items cascades from
    // menu_options, so removing the options first leaves nothing orphaned.
    db.transaction(() => {
      db.prepare("DELETE FROM menu_options WHERE group_id = ?").run(group.id);
      db.prepare("DELETE FROM menu_option_groups WHERE id = ?").run(group.id);
    })();
    res.json({ success: true });
  });

  app.post("/api/option-groups/:groupId/options", (req, res) => {
    const group = db.prepare("SELECT * FROM menu_option_groups WHERE id = ?").get(req.params.groupId) as any;
    if (!group) return res.status(404).json({ error: "That choice group no longer exists." });
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ error: "A choice needs a name." });
    const price = req.body.price === undefined || req.body.price === "" ? 0 : Number(req.body.price);
    // A negative surcharge would quietly discount the dish on the customer's
    // screen, so it is refused rather than stored.
    if (!Number.isFinite(price) || price < 0) return res.status(400).json({ error: "A choice's extra charge must be 0 or more." });
    const num = (v: any) => (v === undefined || v === null || v === "" ? null : Number(v));
    const nextOrder = (db.prepare(
      "SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM menu_options WHERE group_id = ?"
    ).get(group.id) as any).n;
    try {
      const r = db.prepare(`
        INSERT INTO menu_options (group_id, name, name_th, name_ru, price, kcal, protein, grams, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(group.id, name, req.body.name_th || null, req.body.name_ru || null, price,
             num(req.body.kcal), num(req.body.protein), num(req.body.grams), nextOrder);
      res.json({ id: r.lastInsertRowid });
    } catch {
      res.status(409).json({ error: `This group already has a choice called "${name}".` });
    }
  });

  app.patch("/api/options/:optionId", (req, res) => {
    const option = db.prepare("SELECT * FROM menu_options WHERE id = ?").get(req.params.optionId) as any;
    if (!option) return res.status(404).json({ error: "That choice no longer exists." });
    const updates: string[] = [];
    const params: any[] = [];
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ error: "A choice needs a name." });
      updates.push("name = ?"); params.push(name);
    }
    for (const field of ["name_th", "name_ru"]) {
      if (req.body[field] !== undefined) { updates.push(`${field} = ?`); params.push(req.body[field] || null); }
    }
    if (req.body.price !== undefined) {
      const price = req.body.price === "" ? 0 : Number(req.body.price);
      if (!Number.isFinite(price) || price < 0) return res.status(400).json({ error: "A choice's extra charge must be 0 or more." });
      updates.push("price = ?"); params.push(price);
    }
    for (const field of ["kcal", "protein", "grams"]) {
      if (req.body[field] !== undefined) {
        const v = req.body[field] === "" || req.body[field] === null ? null : Number(req.body[field]);
        updates.push(`${field} = ?`); params.push(v);
      }
    }
    // Sold out for today: the ordering page hides it, the recipe and the past
    // receipts stay put.
    if (req.body.available !== undefined) { updates.push("available = ?"); params.push(req.body.available ? 1 : 0); }
    if (updates.length === 0) return res.json({ success: true });
    params.push(option.id);
    try {
      db.prepare(`UPDATE menu_options SET ${updates.join(", ")} WHERE id = ?`).run(...params);
      res.json({ success: true });
    } catch {
      res.status(409).json({ error: "Another choice in this group already has that name." });
    }
  });

  app.delete("/api/options/:optionId", (req, res) => {
    const option = db.prepare("SELECT id FROM menu_options WHERE id = ?").get(req.params.optionId);
    if (!option) return res.status(404).json({ error: "That choice no longer exists." });
    db.prepare("DELETE FROM menu_options WHERE id = ?").run(req.params.optionId);
    res.json({ success: true });
  });

  // Members API
  app.get("/api/members", (req, res) => {
    const q = req.query.q ? `%${req.query.q}%` : '%';
    const members = db.prepare("SELECT * FROM members WHERE name LIKE ? OR phone LIKE ? ORDER BY created_at DESC").all(q, q);
    res.json(members);
  });

  app.post("/api/members", (req, res) => {
    const { name, phone, email } = req.body;
    try {
      const result = db.prepare("INSERT INTO members (name, phone, email, points, tier, total_spent) VALUES (?, ?, ?, 50, 'Silver', 0)").run(name, phone, email || '');
      const newMember = db.prepare("SELECT * FROM members WHERE id = ?").get(result.lastInsertRowid);
      res.json(newMember);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Member registration failed. Phone number may already be registered." });
    }
  });

  app.get("/api/members/:id", (req, res) => {
    const member = db.prepare("SELECT * FROM members WHERE id = ?").get(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });
    
    const memberOrders = db.prepare("SELECT * FROM orders WHERE member_id = ? ORDER BY created_at DESC").all(req.params.id);
    res.json({ ...member, orders: memberOrders });
  });

  app.patch("/api/members/:id", (req, res) => {
    const { name, phone, email, points } = req.body;
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { updates.push("name = ?"); params.push(name); }
    if (phone !== undefined) { updates.push("phone = ?"); params.push(phone); }
    if (email !== undefined) { updates.push("email = ?"); params.push(email); }
    if (points !== undefined) { updates.push("points = ?"); params.push(points); }

    if (updates.length > 0) {
      params.push(req.params.id);
      db.prepare(`UPDATE members SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    }
    res.json({ success: true });
  });

  app.delete("/api/members/:id", (req, res) => {
    db.prepare("DELETE FROM members WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Staff-only stream of order activity. It sits under /api, so the auth guard
  // above already requires a session before a till can listen.
  app.get("/api/events", (req, res) => {
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Caddy flushes text/event-stream by itself; this is for any other proxy
      // that buffers responses by default and would hold every event back.
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();

    const client: LiveClient = { res };
    liveClients.add(client);
    res.write("retry: 3000\n\n");

    // Idle connections are what proxies and phone radios drop. A comment line
    // is ignored by EventSource but keeps the socket alive.
    const ping = setInterval(() => {
      try {
        res.write(": ping\n\n");
      } catch {
        /* already closed; the close handler cleans up */
      }
    }, 25000);

    req.on("close", () => {
      clearInterval(ping);
      liveClients.delete(client);
    });
  });

  app.get("/api/orders", (req, res) => {
    const orders = db.prepare(`
      SELECT o.*, m.name as member_name,
             (SELECT SUM(quantity * price_at_time) FROM order_items WHERE order_id = o.id) as subtotal
      FROM orders o
      LEFT JOIN members m ON o.member_id = m.id
      ORDER BY created_at DESC
    `).all();
    
    const ordersWithTotal = orders.map((o: any) => {
      const discAmount = o.discount_type === 'percentage'
        ? (o.subtotal * (o.discount_value || 0) / 100)
        : (o.discount_value || 0);
      const ptsDiscount = o.points_redeemed || 0;
      const discSubtotal = Math.max(0, o.subtotal - discAmount - ptsDiscount);
      return { ...o, total: discSubtotal * 1.07 };
    });
    
    res.json(ordersWithTotal);
  });

  app.get("/api/orders/:id", (req, res) => {
    const order = db.prepare(`
      SELECT o.*, m.name as member_name,
             (SELECT SUM(quantity * price_at_time) FROM order_items WHERE order_id = o.id) as subtotal
      FROM orders o
      LEFT JOIN members m ON o.member_id = m.id
      WHERE o.id = ?
    `).get(req.params.id) as any;

    if (!order) return res.status(404).json({ error: "Order not found" });
    
    const items = db.prepare(`
      SELECT oi.*, mi.name 
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
    `).all(req.params.id);
    
    const discAmount = order.discount_type === 'percentage'
      ? (order.subtotal * (order.discount_value || 0) / 100)
      : (order.discount_value || 0);
    const ptsDiscount = order.points_redeemed || 0;
    const discSubtotal = Math.max(0, order.subtotal - discAmount - ptsDiscount);
    const total = discSubtotal * 1.07;
    
    res.json({ ...order, total, items });
  });

  app.post("/api/orders", (req, res) => {
    const { table_number, items, notes, discount_type, discount_value, member_id, points_redeemed } = req.body;

    // Both of these used to reach the INSERT and fail on a NOT NULL constraint,
    // which reached the POS as an opaque 500.
    if (table_number === undefined || table_number === null || table_number === "") {
      return res.status(400).json({ error: "A table number is required." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "An order needs at least one item." });
    }
    
    let itemsSubtotal = 0;
    for (const item of items) {
      itemsSubtotal += (item.price || 0) * (item.quantity || 1);
    }
    const discAmount = discount_type === 'percentage'
      ? (itemsSubtotal * (discount_value || 0) / 100)
      : (discount_value || 0);
    const ptsDiscount = points_redeemed || 0;
    const discSubtotal = Math.max(0, itemsSubtotal - discAmount - ptsDiscount);
    const orderTotal = discSubtotal * 1.07;

    const pointsEarned = Math.floor(orderTotal / 50); // Earn 1 point per 50 THB spent

    const transaction = db.transaction(() => {
      const orderResult = db.prepare(`
        INSERT INTO orders (table_number, notes, discount_type, discount_value, member_id, points_earned, points_redeemed) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(table_number, notes, discount_type, discount_value || 0, member_id || null, pointsEarned, ptsDiscount);
      const orderId = orderResult.lastInsertRowid;
      
      const insertItem = db.prepare("INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time) VALUES (?, ?, ?, ?)");
      const deductStock = db.prepare("UPDATE menu_items SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ?");
      for (const item of items) {
        insertItem.run(orderId, item.menu_item_id, item.quantity, item.price);
        deductStock.run(item.quantity, item.menu_item_id);
        // Counter sales draw down ingredients exactly as online orders do.
        consumeForLine(db, Number(orderId), item.menu_item_id,
          Array.isArray(item.options) ? item.options.map((o: any) => (typeof o === 'number' ? o : o.id)) : [],
          item.quantity);
      }

      if (member_id) {
        const member = db.prepare("SELECT * FROM members WHERE id = ?").get(member_id) as any;
        if (member) {
          const newSpent = member.total_spent + orderTotal;
          const newPoints = Math.max(0, member.points - ptsDiscount + pointsEarned);
          let newTier = 'Silver';
          if (newSpent >= 5000) newTier = 'Platinum';
          else if (newSpent >= 2000) newTier = 'Gold';

          db.prepare("UPDATE members SET total_spent = ?, points = ?, tier = ? WHERE id = ?")
            .run(newSpent, newPoints, newTier, member_id);
        }
      }

      return orderId;
    });
    const orderId = transaction();
    broadcast("order.new", { id: orderId, source: "counter" });
    res.json({ id: orderId, points_earned: pointsEarned });
  });

  app.post("/api/orders/:id/pay", (req, res) => {
    db.prepare("UPDATE orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    broadcast("order.updated", { id: Number(req.params.id), status: "paid" });
    res.json({ success: true });
  });

  app.patch("/api/orders/:id/status", (req, res) => {
    const { status } = req.body;
    const updates: string[] = ["status = ?"];
    const params: any[] = [status];

    if (status === 'paid') {
      updates.push("paid_at = CURRENT_TIMESTAMP");
    }

    params.push(req.params.id);
    db.transaction(() => {
      db.prepare(`UPDATE orders SET ${updates.join(", ")} WHERE id = ?`).run(...params);
      // Ingredients are taken when the order is rung up, so a cancellation has
      // to put them back — otherwise a mistyped order silently eats the stock.
      // restoreForOrder is idempotent, so cancelling twice cannot double-credit.
      if (status === 'cancelled') restoreForOrder(db, Number(req.params.id));
    })();
    broadcast("order.updated", { id: Number(req.params.id), status });
    res.json({ success: true });
  });

  // Ingredients, recipes, purchases and food cost. Mounted under /api, so the
  // blanket staff-auth middleware above already covers every route in it.
  app.use("/api/inventory", inventoryRouter(db));

  app.get("/api/reports/daily", (req, res) => {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    
    const paidOrders = db.prepare(`
      SELECT o.*, 
             (SELECT SUM(quantity * price_at_time) FROM order_items WHERE order_id = o.id) as subtotal
      FROM orders o
      WHERE status = 'paid' AND date(paid_at) = date(?)
    `).all(date);

    let totalRevenue = 0;
    for (const o of paidOrders) {
      const discAmount = o.discount_type === 'percentage'
        ? (o.subtotal * (o.discount_value || 0) / 100)
        : (o.discount_value || 0);
      const ptsDiscount = o.points_redeemed || 0;
      const discSubtotal = Math.max(0, o.subtotal - discAmount - ptsDiscount);
      totalRevenue += discSubtotal * 1.07;
    }

    const summary = {
      total_orders: paidOrders.length,
      total_revenue: totalRevenue
    };

    const categoryBreakdown = db.prepare(`
      SELECT mi.category, SUM(oi.quantity * oi.price_at_time) as revenue
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'paid' AND date(o.paid_at) = date(?)
      GROUP BY mi.category
    `).all(date);

    const topItems = db.prepare(`
      SELECT mi.name, SUM(oi.quantity) as total_quantity
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'paid' AND date(o.paid_at) = date(?)
      GROUP BY mi.id
      ORDER BY total_quantity DESC
      LIMIT 5
    `).all(date);

    res.json({ summary, categoryBreakdown, topItems });
  });

  // Staff & Shifts API
  app.get("/api/staff", (req, res) => {
    const staff = db.prepare("SELECT * FROM staff_members").all();
    const shifts = db.prepare("SELECT * FROM staff_shifts ORDER BY clock_in DESC LIMIT 50").all();
    res.json({ staff, shifts });
  });

  app.post("/api/staff/clock-in", (req, res) => {
    const { staff_id } = req.body;
    const staff = db.prepare("SELECT * FROM staff_members WHERE id = ?").get(staff_id) as any;
    if (!staff) return res.status(404).json({ error: "Staff member not found" });

    const now = new Date().toISOString();
    db.prepare("UPDATE staff_members SET status = 'clocked_in', current_shift_start = ? WHERE id = ?").run(now, staff_id);
    const result = db.prepare("INSERT INTO staff_shifts (staff_id, staff_name, role, clock_in) VALUES (?, ?, ?, ?)").run(staff_id, staff.name, staff.role, now);

    res.json({ success: true, shift_id: result.lastInsertRowid, current_shift_start: now });
  });

  app.post("/api/staff/clock-out", (req, res) => {
    const { staff_id } = req.body;
    const staff = db.prepare("SELECT * FROM staff_members WHERE id = ?").get(staff_id) as any;
    if (!staff) return res.status(404).json({ error: "Staff member not found" });

    const now = new Date();
    const nowStr = now.toISOString();

    let hoursWorked = 0;
    if (staff.current_shift_start) {
      const startTime = new Date(staff.current_shift_start);
      const diffMs = Math.max(0, now.getTime() - startTime.getTime());
      hoursWorked = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    const activeShift = db.prepare("SELECT * FROM staff_shifts WHERE staff_id = ? AND clock_out IS NULL ORDER BY clock_in DESC").get(staff_id) as any;
    if (activeShift) {
      db.prepare("UPDATE staff_shifts SET clock_out = ?, hours_worked = ? WHERE id = ?").run(nowStr, hoursWorked, activeShift.id);
    } else {
      const clockIn = staff.current_shift_start || nowStr;
      db.prepare("INSERT INTO staff_shifts (staff_id, staff_name, role, clock_in, clock_out, hours_worked) VALUES (?, ?, ?, ?, ?, ?)").run(staff_id, staff.name, staff.role, clockIn, nowStr, hoursWorked);
    }

    db.prepare("UPDATE staff_members SET status = 'clocked_out', current_shift_start = NULL WHERE id = ?").run(staff_id);

    res.json({ success: true, hours_worked: hoursWorked });
  });

  app.post("/api/staff/members", (req, res) => {
    const { name, role } = req.body;
    if (!name || !role) return res.status(400).json({ error: "Name and role required" });
    const result = db.prepare("INSERT INTO staff_members (name, role, status) VALUES (?, ?, 'clocked_out')").run(name, role);
    const newStaff = db.prepare("SELECT * FROM staff_members WHERE id = ?").get(result.lastInsertRowid);
    res.json(newStaff);
  });

  // Vite middleware for development
  // Menu photos, before the dev/production split so they are served the same
  // either way. The filename holds a hash of the bytes, so a URL never points
  // at different content and can be cached for good.
  app.use(PHOTO_URL, express.static(PHOTO_DIR, {
    immutable: true,
    maxAge: "365d",
    fallthrough: false,
  }));

  if (process.env.NODE_ENV !== "production") {
    // Imported here rather than at the top of the file: a static import
    // resolves at module load even though this branch never runs in
    // production, which would make vite a hard runtime dependency there.
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // The dev server binds 0.0.0.0 so the ordering page can be opened on a
        // phone on the same wifi. That also puts the project directory on the
        // network, and vite serves it: pos.db carries customer phone numbers
        // and the staff PIN, .env carries the session secret. The source is
        // already public on GitHub; these are not.
        fs: { deny: ["**/pos.db", "**/pos.db-*", "**/*.db", "**/.env", "**/.env.*", "**/photos/**"] },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve the built client from ./dist (relative to the app's working dir).
    const distDir = path.join(process.cwd(), "dist");
    app.use(express.static(distDir, {
      setHeaders: (res, filePath) => {
        // Vite content-hashes everything under /assets — safe to cache forever.
        // Unhashed media (menu photos, pins, QR) gets a week; HTML stays fresh.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (/\.(jpe?g|png|webp|svg|woff2?)$/i.test(filePath)) {
          res.setHeader("Cache-Control", "public, max-age=604800");
        } else if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }));
    app.get("*", (req, res) => {
      // Every path used to return the app with a 200, so a typo'd URL looked
      // to Google like a real page and could be indexed. The client router
      // still renders the 404 screen either way — this only fixes the status
      // code, which is the part crawlers act on.
      //
      // Must stay in step with the route table in src/main.tsx.
      const known = ["/order", "/pos", "/privacy", "/offer", "/journal"];
      const p = req.path;
      const isKnown = p === "/" || known.some(r => p === r || p.startsWith(r + "/"));
      res.status(isKnown ? 200 : 404).sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT} (NODE_ENV=${process.env.NODE_ENV || "development"})`);
  });
}

startServer();
