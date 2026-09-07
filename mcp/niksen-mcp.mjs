#!/usr/bin/env node
// The shop's till, as tools an assistant can use.
//
// Read-only on purpose. Everything here answers a question — what sold, what
// is running out, what a dish costs to make. Nothing changes a price, a stock
// count or an order: those live behind the PIN in /pos, where a person is
// looking at what they are about to do. An agent that can quietly re-price the
// menu is a worse trade than typing the change yourself.
//
// Talks to the same HTTP API the till uses, so it sees exactly what staff see
// and inherits the same auth. The PIN is read from the environment and never
// written to a file by this script.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const BASE = (process.env.NIKSEN_POS_URL || 'https://niksensamui.com').replace(/\/$/, '');

// The PIN can come from the environment, or from a file named by it. The file
// exists for clients whose config format has no way to prompt for a secret —
// putting the shop's PIN in a JSON file next to other credentials is worse
// than a chmod 600 file the config merely points at.
function readPin() {
  const direct = process.env.NIKSEN_POS_PIN;
  if (direct) return direct.trim();
  const file = process.env.NIKSEN_POS_PIN_FILE;
  if (!file) return '';
  try {
    return readFileSync(file.replace(/^~/, homedir()), 'utf8').trim();
  } catch (e) {
    throw new Error(`Could not read NIKSEN_POS_PIN_FILE at ${file} — ${(e && e.message) || e}`);
  }
}
// Resolved on first use, not at startup. A bad path here used to throw before
// the MCP handshake, which an editor can only report as "the server died" —
// the same mistake surfaces as a readable tool error instead.
let pinCache = null;
function pin() {
  if (pinCache === null) pinCache = readPin();
  return pinCache;
}

let cookie = null;

/** Anything the network does becomes a sentence naming the address, because
 *  "fetch failed" in an editor's tool output tells nobody which host is down. */
async function reach(url, init) {
  try {
    return await fetch(url, init);
  } catch (e) {
    throw new Error(`Could not reach the POS at ${BASE} — ${(e && e.message) || e}`);
  }
}

async function login() {
  const res = await reach(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: pin() }),
  });
  if (!res.ok) throw new Error('The POS refused that PIN.');
  cookie = (res.headers.get('set-cookie') || '').split(';')[0] || null;
  if (!cookie) throw new Error('The POS accepted the PIN but sent no session.');
}

/** One retry on 401 and no more: a PIN that is wrong stays wrong, and a loop
 *  of login attempts against a live shop is indistinguishable from an attack. */
async function api(path) {
  if (!pin()) throw new Error('No PIN: set NIKSEN_POS_PIN, or NIKSEN_POS_PIN_FILE pointing at a file holding it.');
  if (!cookie) await login();
  let res = await reach(`${BASE}${path}`, { headers: { Cookie: cookie } });
  if (res.status === 401) {
    await login();
    res = await reach(`${BASE}${path}`, { headers: { Cookie: cookie } });
  }
  if (!res.ok) throw new Error(`POS ${path} answered ${res.status}`);
  return res.json();
}

const baht = n => `฿${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
const text = s => ({ content: [{ type: 'text', text: s }] });

const server = new McpServer({ name: 'niksen-pos', version: '1.0.0' });

server.registerTool('sales_report', {
  title: 'Daily sales',
  description: 'Revenue, order count, revenue by category and best sellers for one day. Days run on Thai time. Omit the date for today.',
  inputSchema: { date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('YYYY-MM-DD, Thai time') },
}, async ({ date }) => {
  const r = await api(`/api/reports/daily${date ? `?date=${date}` : ''}`);
  const cats = (r.categoryBreakdown || []).map(c => `  ${c.category}: ${baht(c.revenue)}`).join('\n') || '  (nothing sold)';
  const top = (r.topItems || []).map((t, i) => `  ${i + 1}. ${t.name} — ${t.total_quantity} sold`).join('\n') || '  (nothing sold)';
  return text(
    `Sales for ${r.date || date || 'today'} (Thai time)\n` +
    `Revenue (incl. 7% tax): ${baht(r.summary?.total_revenue)}\n` +
    `Paid orders: ${r.summary?.total_orders ?? 0}\n\nBy category:\n${cats}\n\nBest sellers:\n${top}`,
  );
});

server.registerTool('menu', {
  title: 'Menu items',
  description: 'Every dish and drink with its price, category, stock and whether customers can currently see it. Items priced at 0 are hidden from the ordering page.',
  inputSchema: { category: z.string().optional().describe('Only this category') },
}, async ({ category }) => {
  const items = await api('/api/menu');
  const rows = items
    .filter(i => !category || String(i.category).toLowerCase() === category.toLowerCase())
    .map(i => `${i.available ? ' ' : '·'} ${i.name} — ${i.price > 0 ? baht(i.price) : 'no price yet, hidden'} · ${i.category} · stock ${i.stock_quantity}`)
    .join('\n');
  return text(rows || 'Nothing matches that.');
});

server.registerTool('low_stock', {
  title: 'Running out',
  description: 'Menu items at or below their own low-stock alert level, and anything already at zero.',
  inputSchema: {},
}, async () => {
  const items = await api('/api/menu');
  const low = items.filter(i => Number(i.stock_quantity) <= Number(i.low_stock_threshold ?? 2));
  if (low.length === 0) return text('Nothing is running low.');
  return text(low
    .sort((a, b) => a.stock_quantity - b.stock_quantity)
    .map(i => `${i.stock_quantity === 0 ? 'OUT' : 'LOW'}  ${i.name} — ${i.stock_quantity} left (alerts at ${i.low_stock_threshold ?? 2})`)
    .join('\n'));
});

server.registerTool('open_orders', {
  title: 'Orders still open',
  description: 'Orders that have not been paid yet, oldest first, with what is on them.',
  inputSchema: {},
}, async () => {
  const orders = await api('/api/orders');
  const open = orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled');
  if (open.length === 0) return text('No open orders.');
  // The list endpoint carries no lines, so each order is fetched for them.
  // Capped: a till with a hundred open orders has a problem an assistant
  // reading all of them will not fix.
  const shown = open.slice(0, 20);
  const detailed = await Promise.all(shown.map(o => api(`/api/orders/${o.id}`).catch(() => o)));
  const body = detailed.map(o => {
    const who = o.order_type && o.order_type !== 'dine_in'
      ? `${o.order_type} · ${o.customer_name || '?'}`
      : `table ${o.table_number}`;
    const items = (o.items || []).map(i => `${i.quantity}× ${i.name}`).join(', ') || '(no lines)';
    return `#${o.id} (${o.status}) ${who} — ${baht(o.total)}\n    ${items}`;
  }).join('\n');
  const more = open.length > shown.length ? `\n… and ${open.length - shown.length} more` : '';
  return text(body + more);
});

server.registerTool('dish_costs', {
  title: 'Cost and margin per dish',
  description: 'What each dish costs to make from its recipe, against what it sells for. Dishes with no recipe have no cost yet.',
  inputSchema: {},
}, async () => {
  const rows = await api('/api/inventory/costs');
  if (!rows.length) return text('No recipes are costed yet.');
  return text(rows.map(r => {
    if (!(r.cost > 0)) return `${r.name} — ${baht(r.price)}, no recipe yet`;
    const margin = r.price > 0 ? Math.round(((r.price - r.cost) / r.price) * 100) : 0;
    return `${r.name} — sells ${baht(r.price)}, costs ${baht(r.cost)}, margin ${margin}%`;
  }).join('\n'));
});

server.registerTool('expiring_stock', {
  title: 'Ingredients going off',
  description: 'Ingredient lots that expire within the next few days.',
  inputSchema: { days: z.number().int().min(1).max(90).optional().describe('How far ahead to look. Default 7.') },
}, async ({ days }) => {
  const rows = await api(`/api/inventory/expiring?days=${days ?? 7}`);
  if (!rows.length) return text(`Nothing expires in the next ${days ?? 7} days.`);
  return text(rows.map(r => {
    const when = r.days_left === 0 ? 'today' : r.days_left === 1 ? 'tomorrow' : `in ${r.days_left} days`;
    return `${r.ingredient_name} — ${r.qty_remaining} ${r.unit}, ${when} (${r.expires_on})`;
  }).join('\n'));
});

await server.connect(new StdioServerTransport());
