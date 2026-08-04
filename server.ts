import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

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

// Populate initial barcodes and sample low stock if missing
db.exec(`
  UPDATE menu_items SET barcode = '88500000' || PRINTF('%02d', id) WHERE barcode IS NULL OR barcode = '';
  UPDATE menu_items SET stock_quantity = 5 WHERE id IN (1, 4, 8) AND (stock_quantity IS NULL OR stock_quantity = 50);
  UPDATE menu_items SET stock_quantity = 0 WHERE id IN (6) AND (stock_quantity IS NULL OR stock_quantity = 50);
  UPDATE menu_items SET stock_quantity = 45 WHERE stock_quantity IS NULL;
  UPDATE menu_items SET low_stock_threshold = 10 WHERE low_stock_threshold IS NULL;
`);

// Auto-convert existing IDR high prices to THB if needed
try { db.exec("UPDATE menu_items SET price = ROUND(price / 250) WHERE price > 1000"); } catch (e) {}

// Seed initial settings for Google Business Profile
const gbpId = "7913-3673-9603-8976-65";
const storeCode = "13998080146830637367";

db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("google_business_profile_id", gbpId);
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("google_store_code", storeCode);

// Seed initial menu items in THB if empty
const count = db.prepare("SELECT COUNT(*) as count FROM menu_items").get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare("INSERT INTO menu_items (name, category, price) VALUES (?, ?, ?)");
  const seedItems = [
    ["Bintang Beer", "Beers", 120],
    ["Heineken", "Beers", 140],
    ["San Miguel", "Beers", 130],
    ["Classic Mojito", "Cocktails", 220],
    ["Margarita", "Cocktails", 240],
    ["Negroni", "Cocktails", 260],
    ["Jack Daniels", "Spirits", 280],
    ["Craft Cola", "Craft Soda", 80],
    ["Ginger Beer", "Craft Soda", 90],
    ["Lemonade", "Craft Soda", 70],
    ["Hatten Aga White", "Local Wine", 650],
    ["Two Islands Shiraz", "Local Wine", 850],
    ["Sababay Ludisia", "Local Wine", 750],
    ["Chardonnay", "Wine Other", 1200],
    ["Cabernet Sauvignon", "Wine Other", 1400],
    ["Nasi Goreng", "Food", 140],
    ["Chicken Wings", "Food", 120],
    ["French Fries", "Food", 90],
    ["Beef Burger", "Food", 180]
  ];
  for (const item of seedItems) {
    insert.run(...item);
  }
}

// Seed initial members if empty
const memberCount = db.prepare("SELECT COUNT(*) as count FROM members").get() as { count: number };
if (memberCount.count === 0) {
  const insertMember = db.prepare("INSERT INTO members (name, phone, email, points, tier, total_spent) VALUES (?, ?, ?, ?, ?, ?)");
  insertMember.run("Somporn Chai", "0812345678", "somporn@example.com", 250, "Gold", 2800);
  insertMember.run("Alex Rivera", "0898765432", "alex@example.com", 620, "Platinum", 6400);
  insertMember.run("Nan Phukaew", "0855551234", "nan@example.com", 80, "Silver", 950);
}

// Seed initial staff members and shifts if empty
const staffCount = db.prepare("SELECT COUNT(*) as count FROM staff_members").get() as { count: number };
if (staffCount.count === 0) {
  const insertStaff = db.prepare("INSERT INTO staff_members (name, role, status, current_shift_start) VALUES (?, ?, ?, ?)");
  insertStaff.run("Ananda Prasert", "Head Bartender", "clocked_in", new Date(Date.now() - 4.5 * 3600 * 1000).toISOString());
  insertStaff.run("Kanya Somchai", "Senior Mixologist", "clocked_out", null);
  insertStaff.run("Tawatchai Siri", "Bar Supervisor", "clocked_in", new Date(Date.now() - 2 * 3600 * 1000).toISOString());
  insertStaff.run("Natasha Vane", "Floor Server", "clocked_out", null);

  const insertShift = db.prepare("INSERT INTO staff_shifts (staff_id, staff_name, role, clock_in, clock_out, hours_worked) VALUES (?, ?, ?, ?, ?, ?)");
  const todayMorning = new Date();
  todayMorning.setHours(9, 0, 0, 0);
  const todayAfternoon = new Date();
  todayAfternoon.setHours(16, 30, 0, 0);

  insertShift.run(2, "Kanya Somchai", "Senior Mixologist", todayMorning.toISOString(), todayAfternoon.toISOString(), 7.5);
  
  // Active shift logs
  const nowStr = new Date().toISOString();
  insertShift.run(1, "Ananda Prasert", "Head Bartender", new Date(Date.now() - 4.5 * 3600 * 1000).toISOString(), null, 0);
  insertShift.run(3, "Tawatchai Siri", "Bar Supervisor", new Date(Date.now() - 2 * 3600 * 1000).toISOString(), null, 0);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'niksen-pos-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      sameSite: 'none',
      httpOnly: true,
    }
  }));

  // API Routes
  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsMap = settings.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(settingsMap);
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
                  window.location.href = '/';
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
    const { name, category, price, image_url, barcode, stock_quantity, low_stock_threshold } = req.body;
    const barcodeVal = barcode || `88500000${Math.floor(Math.random() * 90 + 10)}`;
    const stockVal = stock_quantity !== undefined ? stock_quantity : 50;
    const lowVal = low_stock_threshold !== undefined ? low_stock_threshold : 10;
    const result = db.prepare("INSERT INTO menu_items (name, category, price, image_url, barcode, stock_quantity, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?)").run(name, category, price, image_url, barcodeVal, stockVal, lowVal);
    res.json({ id: result.lastInsertRowid });
  });

  app.patch("/api/menu/:id", (req, res) => {
    const { name, category, price, available, image_url, barcode, stock_quantity, low_stock_threshold } = req.body;
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name);
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
      return { ...o, total: discSubtotal * 1.10 };
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
    const total = discSubtotal * 1.10;
    
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
    const orderTotal = discSubtotal * 1.10;

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
      totalRevenue += discSubtotal * 1.10;
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
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
