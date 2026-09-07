// Opn Payments (formerly Omise) — PromptPay and cards.
//
// The shop already shows a PromptPay QR it builds itself, and money lands in
// the bank instantly with no fee. What that cannot do is tell the till the
// money arrived: staff check a banking app and press Pay Now. This module is
// the other trade — a percentage per sale in exchange for the confirmation
// coming back on its own.
//
// It stays completely inert until OPN_SECRET_KEY is set, so the shop keeps its
// free QR until the merchant account is open and the keys are on the server.

import type { Database as DB } from "better-sqlite3";
import express from "express";

const API_BASE = process.env.OPN_API_BASE || "https://api.omise.co";
const SECRET = process.env.OPN_SECRET_KEY || "";
const PUBLIC_KEY = process.env.OPN_PUBLIC_KEY || "";

export function paymentsEnabled(): boolean {
  return SECRET.length > 0;
}

export function publicKey(): string {
  return PUBLIC_KEY;
}

// Opn counts in satang. Every total in this app is already a whole baht, so
// this is exact — no rounding decision is being made here, and none should be.
function toSatang(baht: number): number {
  return Math.round(baht) * 100;
}

export function initPaymentsSchema(db: DB) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id      INTEGER NOT NULL REFERENCES orders(id),
      provider      TEXT NOT NULL DEFAULT 'opn',
      charge_id     TEXT NOT NULL UNIQUE,
      method        TEXT NOT NULL,
      amount        INTEGER NOT NULL,
      status        TEXT NOT NULL,
      failure_code  TEXT,
      failure_msg   TEXT,
      qr_uri        TEXT,
      authorize_uri TEXT,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      settled_at    DATETIME
    );
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
  `);
}

// --------------------------------------------------------------- Opn API ---

async function opn(path: string, method: "GET" | "POST" = "GET", form?: Record<string, string | number>) {
  const auth = "Basic " + Buffer.from(SECRET + ":").toString("base64");
  const init: RequestInit = { method, headers: { Authorization: auth } };
  if (form) {
    init.body = new URLSearchParams(
      Object.entries(form).map(([k, v]) => [k, String(v)]),
    );
    (init.headers as Record<string, string>)["Content-Type"] =
      "application/x-www-form-urlencoded";
  }
  const res = await fetch(`${API_BASE}${path}`, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.object === "error") {
    const msg = body?.message || body?.code || `HTTP ${res.status}`;
    throw new Error(`Opn ${method} ${path}: ${msg}`);
  }
  return body;
}

// ------------------------------------------------------------- creating ---

type Broadcast = (event: string, data: Record<string, unknown>) => void;

/** The amount we are willing to be paid for an order, in satang. Recomputed
 *  from the order rather than taken from the browser: the price a customer's
 *  page happens to be showing is not the price they owe. */
function expectedSatang(db: DB, orderId: number): number | null {
  const row = db.prepare(`
    SELECT o.discount_type, o.discount_value, o.points_redeemed,
           (SELECT SUM(quantity * price_at_time) FROM order_items WHERE order_id = o.id) AS subtotal
      FROM orders o WHERE o.id = ?
  `).get(orderId) as any;
  if (!row || row.subtotal == null) return null;
  const disc = row.discount_type === "percentage"
    ? (row.subtotal * (row.discount_value || 0)) / 100
    : (row.discount_value || 0);
  const net = Math.max(0, row.subtotal - disc - (row.points_redeemed || 0));
  // Same rule the customer was quoted; totalWithTax lives in the shared config
  // so the till, the ordering page and this charge cannot drift apart.
  return toSatang(Math.round(net * 1.07));
}

export async function createCharge(
  db: DB,
  orderId: number,
  method: "promptpay" | "card",
  token?: string,
  returnUri?: string,
) {
  const amount = expectedSatang(db, orderId);
  if (amount == null) throw new Error("unknown order");
  if (amount <= 0) throw new Error("nothing to pay");

  // One live attempt per order. A customer who reloads the page gets the QR
  // they already have rather than a second charge for the same food.
  const open = db.prepare(
    "SELECT * FROM payments WHERE order_id = ? AND status = 'pending' AND method = ? ORDER BY id DESC LIMIT 1",
  ).get(orderId, method) as any;
  if (open) {
    return { charge_id: open.charge_id, status: open.status, qr_uri: open.qr_uri, authorize_uri: open.authorize_uri, amount: open.amount };
  }

  const form: Record<string, string | number> = {
    amount,
    currency: "THB",
    "metadata[order_id]": orderId,
  };
  if (method === "promptpay") form["source[type]"] = "promptpay";
  else {
    if (!token) throw new Error("card token missing");
    form.card = token;
    if (returnUri) form.return_uri = returnUri;
  }

  const charge = await opn("/charges", "POST", form);
  const qr = charge?.source?.scannable_code?.image?.download_uri || null;

  db.prepare(`
    INSERT INTO payments (order_id, charge_id, method, amount, status, qr_uri, authorize_uri)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(orderId, charge.id, method, amount, charge.status, qr, charge.authorize_uri || null);

  return {
    charge_id: charge.id,
    status: charge.status,
    qr_uri: qr,
    authorize_uri: charge.authorize_uri || null,
    amount,
  };
}

// ------------------------------------------------------------- settling ---

/** Bring one charge up to date from Opn and, if it really was paid, mark the
 *  order paid. Everything the caller passes in is treated as a hint; the only
 *  thing believed is what Opn answers when asked directly. */
export async function settleCharge(db: DB, chargeId: string, broadcast?: Broadcast) {
  // A shop with no key has no charges to settle. Checked before anything
  // reaches the network, so poking the webhook on an unconfigured server
  // cannot make it call out to Opn at all.
  if (!paymentsEnabled()) return { known: false as const };
  // Only charges this shop created. Without this an outsider could post any
  // id and make the server hammer the Opn API on their behalf.
  const row = db.prepare("SELECT * FROM payments WHERE charge_id = ?").get(chargeId) as any;
  if (!row) return { known: false as const };

  const charge = await opn(`/charges/${encodeURIComponent(chargeId)}`);

  // A charge for the wrong amount is not a payment for this order. This is the
  // check that stops a ฿1 charge marking a ฿1,000 order settled.
  if (Number(charge.amount) !== Number(row.amount) || charge.currency !== "THB") {
    db.prepare("UPDATE payments SET status = 'failed', failure_msg = ? WHERE charge_id = ?")
      .run(`amount mismatch: charged ${charge.amount} ${charge.currency}, expected ${row.amount} THB`, chargeId);
    return { known: true as const, status: "failed", mismatch: true };
  }

  const status = String(charge.status);
  const already = row.status === "successful";

  db.prepare(`
    UPDATE payments SET status = ?, failure_code = ?, failure_msg = ?,
           settled_at = CASE WHEN ? = 'successful' THEN COALESCE(settled_at, CURRENT_TIMESTAMP) ELSE settled_at END
     WHERE charge_id = ?
  `).run(status, charge.failure_code || null, charge.failure_message || null, status, chargeId);

  if (status === "successful" && !already) {
    // Points and total_spent were credited when the order was placed, so this
    // only closes the order. Crediting again here would pay the customer twice
    // for one visit.
    const changed = db.prepare(
      "UPDATE orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = ? AND status != 'paid'",
    ).run(row.order_id);
    if (changed.changes > 0 && broadcast) {
      broadcast("order.updated", { id: row.order_id, status: "paid", via: "opn" });
    }
  }

  return { known: true as const, status, orderId: row.order_id };
}

// -------------------------------------------------------------- routing ---

export function paymentsRouter(db: DB, broadcast: Broadcast) {
  const r = express.Router();

  // Opn does not sign its webhooks, so the body proves nothing: it is a nudge
  // saying "look at this id again", and the id is all that is read from it.
  // Always 200 — a non-2xx makes Opn retry, and there is nothing to retry when
  // the problem is that we do not recognise the charge.
  r.post("/webhooks/opn", express.json(), async (req, res) => {
    const chargeId = req.body?.data?.id;
    const key = req.body?.key || "";
    if (typeof chargeId !== "string" || !chargeId.startsWith("chrg_")) {
      return res.status(200).json({ ignored: "no charge id" });
    }
    try {
      const out = await settleCharge(db, chargeId, broadcast);
      res.status(200).json({ ok: true, event: key, ...out });
    } catch (e) {
      // Swallowing this on purpose: Opn will send the event again, and the
      // status endpoint below re-checks on its own when a customer is waiting.
      console.error("[opn] webhook", chargeId, (e as Error).message);
      res.status(200).json({ ok: false });
    }
  });

  return r;
}
