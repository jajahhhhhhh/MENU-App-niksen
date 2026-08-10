import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { orderingOpen } from "./src/config.ts";
import { SqliteSessionStore } from "./sessionStore.ts";

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

// Configurable items (the build-your-own bowl) carry option groups the flat
// menu_items table can't express. Created here as well as in seed-bowl-builder
// so the server starts cleanly on a database that has never been seeded.
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
  app.use(express.json());
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
      SELECT o.id, o.name, o.price, o.kcal, o.protein, g.name AS group_name
      FROM menu_options o
      JOIN menu_option_groups g ON g.id = o.group_id
      WHERE o.id = ? AND g.menu_item_id = ? AND o.available = 1
    `);
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
          chosen.push({ id: opt.id, group: opt.group_name, name: opt.name, price: opt.price, kcal: opt.kcal, protein: opt.protein });
          unitPrice += opt.price;
        }
        if (chosen.length === 0) chosen = null;
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

  app.post("/api/menu", (req, res) => {
    const { name, name_th, name_ru, description, description_th, description_ru, category, price, image_url, barcode, stock_quantity, low_stock_threshold } = req.body;
    const barcodeVal = barcode || `88500000${Math.floor(Math.random() * 90 + 10)}`;
    const stockVal = stock_quantity !== undefined ? stock_quantity : 50;
    const lowVal = low_stock_threshold !== undefined ? low_stock_threshold : 10;
    const result = db.prepare("INSERT INTO menu_items (name, name_th, name_ru, description, description_th, description_ru, category, price, image_url, barcode, stock_quantity, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(name, name_th || null, name_ru || null, description || null, description_th || null, description_ru || null, category, price, image_url, barcodeVal, stockVal, lowVal);
    res.json({ id: result.lastInsertRowid });
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
    if (image_url !== undefined) {
      updates.push("image_url = ?");
      params.push(image_url);
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
    }

    res.json({ success: true });
  });

  app.delete("/api/menu/:id", (req, res) => {
    const id = Number(req.params.id);
    const item = db.prepare("SELECT id, name FROM menu_items WHERE id = ?").get(id) as any;
    if (!item) return res.status(404).json({ error: "not_found" });
    // Items referenced by past orders can't be hard-deleted (order_items FK +
    // receipt history) — hide them from the menu instead and say so.
    const used = db.prepare("SELECT COUNT(*) AS n FROM order_items WHERE menu_item_id = ?").get(id) as any;
    if (used.n > 0) {
      db.prepare("UPDATE menu_items SET available = 0 WHERE id = ?").run(id);
      return res.json({ success: true, hidden: true, order_lines: used.n });
    }
    db.prepare("DELETE FROM menu_items WHERE id = ?").run(id);
    res.json({ success: true, deleted: true });
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
    res.json({ id: orderId, points_earned: pointsEarned });
  });

  app.post("/api/orders/:id/pay", (req, res) => {
    db.prepare("UPDATE orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
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
    db.prepare(`UPDATE orders SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    res.json({ success: true });
  });

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
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve the built client from ./dist (relative to the app's working dir).
    const distDir = path.join(process.cwd(), "dist");
    app.use(express.static(distDir));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT} (NODE_ENV=${process.env.NODE_ENV || "development"})`);
  });
}

startServer();
