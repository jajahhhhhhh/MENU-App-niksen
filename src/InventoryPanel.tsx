/**
 * Ingredients, purchases, recipes and food cost — the counter-facing side of
 * inventory.ts.
 *
 * Kept in its own file because App.tsx is already 2,600 lines; everything here
 * talks to /api/inventory and holds no state the rest of the POS needs.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Boxes, Plus, Trash2, AlertTriangle, Clock, Calculator, ShoppingCart,
  ChefHat, X, TrendingDown, Check, Upload,
} from 'lucide-react';

const api = async (path: string, opts?: RequestInit) => {
  const r = await fetch(`/api/inventory${path}`, {
    ...opts,
    headers: opts?.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
  return r.json();
};

const baht = (n: number | null | undefined) =>
  n == null ? '—' : `฿${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const qty = (n: number, unit: string) =>
  `${Number(n.toFixed(2)).toLocaleString()} ${unit}`;

const today = () => new Date().toISOString().slice(0, 10);

interface Ingredient {
  id: number; name: string; name_th: string | null; unit: string;
  default_cost: number | null; low_stock_threshold: number; supplier: string | null;
  pack_size: number | null; pack_label: string | null;
  active: number; unit_cost: number | null; on_hand: number;
  stock_value: number | null; low: boolean;
}
interface Lot {
  id: number; ingredient_id: number; ingredient_name: string; unit: string;
  qty_purchased: number; qty_remaining: number; total_cost: number; unit_cost: number;
  purchased_on: string; expires_on: string | null; days_left: number | null; note: string | null;
}
interface Cost {
  menu_item_id: number; name: string; price: number; cost: number | null;
  partial_cost: number; has_recipe: boolean; cost_complete: boolean;
  missing: string[]; margin: number | null; margin_pct: number | null;
}

type Section = 'ingredients' | 'purchases' | 'recipes' | 'costs';

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-3xl border border-stone-200 shadow-sm p-6 ${className}`}>{children}</div>
);

const Field = ({ label, children }: any) => (
  <label className="block">
    <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);

const input = 'w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40';

export default function InventoryPanel({ menuItems }: { menuItems: { id: number; name: string; price: number; category: string }[] }) {
  const [section, setSection] = useState<Section>('ingredients');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [i, l, c, s] = await Promise.all([
        api('/ingredients'), api('/lots'), api('/costs'), api('/summary'),
      ]);
      setIngredients(i); setLots(l); setCosts(c); setSummary(s); setError('');
    } catch (e: any) { setError(e.message); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const run = async (fn: () => Promise<any>) => {
    setBusy(true);
    try { await fn(); await reload(); setError(''); }
    catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };

  const expiring = lots.filter(l => l.days_left != null && l.days_left <= 7);
  const negative = ingredients.filter(i => i.on_hand < 0);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl px-4 py-3 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span>
        </div>
      )}

      {/* What needs attention, before anything else on the page. */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Stock value" value={baht(summary.stock_value)} sub={
            summary.ingredients_without_cost > 0
              ? `${summary.ingredients_without_cost} without a cost` : 'all ingredients priced'} />
          <Stat label="Expiring in 7 days" value={String(summary.expiring_7d)} tone={summary.expiring_7d ? 'warn' : undefined}
            sub={summary.expired > 0 ? `${summary.expired} already expired` : 'nothing overdue'}
            subTone={summary.expired > 0 ? 'bad' : undefined} />
          <Stat label="Dishes costed" value={`${summary.dishes_costed}/${summary.dishes_total}`}
            sub={`${summary.dishes_with_recipe} have a recipe`} />
          <Stat label="Over-sold" value={String(summary.ingredients_negative)}
            tone={summary.ingredients_negative ? 'bad' : undefined}
            sub={summary.ingredients_negative ? 'sold more than bought' : 'stock adds up'} />
        </div>
      )}

      {(expiring.length > 0 || negative.length > 0) && (
        <Card className="!p-0 overflow-hidden">
          {expiring.length > 0 && (
            <div className="p-5 border-b border-stone-100">
              <h3 className="font-bold flex items-center gap-2 text-amber-700">
                <Clock className="w-4 h-4" /> Use these first
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {expiring.map(l => (
                  <span key={l.id} className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                    (l.days_left ?? 0) < 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'}`}>
                    {l.ingredient_name} · {qty(l.qty_remaining, l.unit)} ·{' '}
                    {(l.days_left ?? 0) < 0 ? `expired ${Math.abs(l.days_left ?? 0)}d ago`
                      : (l.days_left === 0 ? 'today' : `${l.days_left}d left`)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {negative.length > 0 && (
            <div className="p-5 bg-red-50/50">
              <h3 className="font-bold flex items-center gap-2 text-red-700">
                <TrendingDown className="w-4 h-4" /> Sold more than recorded
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Either a delivery was never logged, or a recipe quantity is too high.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {negative.map(i => (
                  <span key={i.id} className="text-xs px-3 py-1.5 rounded-full font-semibold bg-red-100 text-red-800">
                    {i.name} · {qty(i.on_hand, i.unit)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="flex bg-stone-200/80 p-1.5 rounded-2xl gap-1 w-fit">
        {([
          ['ingredients', 'Ingredients', Boxes],
          ['purchases', 'Purchases', ShoppingCart],
          ['recipes', 'Recipes', ChefHat],
          ['costs', 'Food cost', Calculator],
        ] as [Section, string, any][]).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setSection(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              section === key ? 'bg-white text-stone-900 shadow-md' : 'text-stone-600 hover:text-stone-900'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {section === 'ingredients' && <Ingredients rows={ingredients} run={run} busy={busy} />}
      {section === 'purchases' && <Purchases lots={lots} ingredients={ingredients} run={run} busy={busy} />}
      {section === 'recipes' && <Recipes menuItems={menuItems} ingredients={ingredients} costs={costs} onChange={reload} />}
      {section === 'costs' && <Costs rows={costs} />}
    </div>
  );
}

const Stat = ({ label, value, sub, tone, subTone }: any) => (
  <div className={`rounded-2xl border p-4 ${
    tone === 'bad' ? 'bg-red-50 border-red-200' : tone === 'warn' ? 'bg-amber-50 border-amber-200' : 'bg-white border-stone-200'}`}>
    <div className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{label}</div>
    <div className="text-2xl font-bold mt-1">{value}</div>
    <div className={`text-[11px] mt-0.5 ${subTone === 'bad' ? 'text-red-600 font-semibold' : 'text-stone-500'}`}>{sub}</div>
  </div>
);

// ------------------------------------------------------------- ingredients ---

function Ingredients({ rows, run, busy }: { rows: Ingredient[]; run: any; busy: boolean }) {
  const [form, setForm] = useState({ name: '', name_th: '', unit: 'g', default_cost: '', low_stock_threshold: '', supplier: '', pack_size: '' });
  const add = () => run(async () => {
    await api('/ingredients', { method: 'POST', body: JSON.stringify(form) });
    setForm({ name: '', name_th: '', unit: 'g', default_cost: '', low_stock_threshold: '', supplier: '', pack_size: '' });
  });

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-bold mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Add an ingredient</h3>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <Field label="Name"><input className={input} value={form.name} placeholder="Sourdough"
            onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="ชื่อไทย"><input className={input} value={form.name_th}
            onChange={e => setForm({ ...form, name_th: e.target.value })} /></Field>
          <Field label="Unit">
            <select className={input} value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
              <option value="g">grams</option><option value="ml">millilitres</option><option value="piece">pieces</option>
            </select>
          </Field>
          <Field label="Cost / unit">
            <input className={input} type="number" step="0.0001" placeholder="optional" value={form.default_cost}
              onChange={e => setForm({ ...form, default_cost: e.target.value })} />
          </Field>
          <Field label="Warn below">
            <input className={input} type="number" step="any" value={form.low_stock_threshold}
              onChange={e => setForm({ ...form, low_stock_threshold: e.target.value })} />
          </Field>
          <Field label="Pack size">
            {/* Shops price a bag, not a gram. Recording "1 pack = 300 g" lets a
                purchase be entered as one pack while recipes stay in grams. */}
            <div className="flex items-center gap-1">
              <input className={input} type="number" step="any" placeholder="e.g. 300"
                value={form.pack_size}
                onChange={e => setForm({ ...form, pack_size: e.target.value })} />
              <span className="text-xs text-stone-400 whitespace-nowrap">{form.unit} / pack</span>
            </div>
          </Field>
          <Field label="Supplier"><input className={input} value={form.supplier}
            onChange={e => setForm({ ...form, supplier: e.target.value })} /></Field>
        </div>
        <p className="text-[11px] text-stone-500 mt-3">
          Cost per unit is a placeholder until the first purchase is recorded — after that the real
          purchase price is used, averaged over what's still on the shelf.
        </p>
        <button onClick={add} disabled={busy || !form.name.trim()}
          className="mt-4 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-bold disabled:opacity-40">
          Add ingredient
        </button>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-[11px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="text-left px-5 py-3">Ingredient</th>
              <th className="text-right px-5 py-3">On hand</th>
              <th className="text-right px-5 py-3">Cost / unit</th>
              <th className="text-right px-5 py-3">Value</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-stone-400">No ingredients yet.</td></tr>
            )}
            {rows.map(i => (
              <tr key={i.id} className={`border-t border-stone-100 ${i.active ? '' : 'opacity-40'}`}>
                <td className="px-5 py-3">
                  <div className="font-semibold">{i.name}</div>
                  <div className="text-xs text-stone-500">{i.name_th}{i.supplier ? ` · ${i.supplier}` : ''}</div>
                </td>
                <td className={`px-5 py-3 text-right font-mono ${
                  i.on_hand < 0 ? 'text-red-600 font-bold' : i.low ? 'text-amber-600 font-bold' : ''}`}>
                  {qty(i.on_hand, i.unit)}
                </td>
                <td className="px-5 py-3 text-right font-mono">
                  {i.unit_cost == null
                    ? <span className="text-amber-600 font-semibold">not priced</span>
                    : `${baht(i.unit_cost)}/${i.unit}`}
                </td>
                <td className="px-5 py-3 text-right font-mono">{baht(i.stock_value)}</td>
                <td className="px-5 py-3 text-right">
                  <button title="Remove or retire"
                    onClick={() => run(() => api(`/ingredients/${i.id}`, { method: 'DELETE' }))}
                    className="text-stone-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// --------------------------------------------------------------- purchases ---


/**
 * A delivery is twenty lines on a receipt. Typing them one at a time is how
 * purchases stop being recorded, and without purchases every dish cost falls
 * back to a guess. This takes the 03-purchases.csv the staff were given.
 *
 * The file is always read once before anything is written, and a file with any
 * bad line writes nothing at all: a half-imported bill cannot be told from a
 * whole one, and importing it again to be sure doubles whatever did land.
 */
function ImportPurchases({ run, busy }: any) {
  const [report, setReport] = useState<any>(null);
  const [csv, setCsv] = useState<string>('');
  const [name, setName] = useState<string>('');

  const send = (text: string, commit: boolean) => run(async () => {
    const res = await api('/lots/import', {
      method: 'POST',
      body: JSON.stringify({ csv: text, commit }),
    });
    setReport(res);
    if (!res.preview) { setCsv(''); setName(''); }
  });

  const pick = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setCsv(text); setName(file.name); setReport(null);
    send(text, false);
  };

  const clear = () => { setCsv(''); setName(''); setReport(null); };
  const bad = report?.rows?.filter((r: any) => r.error) || [];
  const good = report?.rows?.filter((r: any) => !r.error) || [];

  return (
    <Card>
      <h3 className="font-bold mb-1 flex items-center gap-2">
        <Upload className="w-4 h-4" /> Import a bill from CSV
      </h3>
      <p className="text-[11px] text-stone-400 mb-4">
        Columns: <span className="font-mono">ingredient_name, amount, unit, total_paid_THB, bought_on, expires_on, note</span>.
        Buy in kilos or litres and it converts; write <span className="font-mono">pack</span> for an ingredient that has a pack size.
        Thai ingredient names work too.
      </p>

      <div className="flex items-center gap-3">
        <label className="cursor-pointer">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-50 border border-dashed border-stone-300 rounded-xl hover:bg-stone-100 text-sm font-bold text-stone-600">
            <Upload className="w-4 h-4 text-stone-400" /> Choose CSV
          </div>
          <input type="file" accept=".csv,text/csv" className="hidden"
            onChange={e => { pick(e.target.files?.[0]); e.currentTarget.value = ''; }} />
        </label>
        {name && <span className="text-sm text-stone-500 truncate">{name}</span>}
        {report && (
          <button type="button" onClick={clear} className="ml-auto text-xs font-bold text-stone-400 hover:text-stone-700">
            Clear
          </button>
        )}
      </div>

      {report && !report.preview && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800 font-medium flex items-center gap-2">
          <Check className="w-4 h-4" /> Imported {report.imported} purchase{report.imported === 1 ? '' : 's'}.
        </div>
      )}

      {report?.preview && (
        <div className="mt-4 space-y-3">
          <div className="text-sm">
            <span className="font-bold">{good.length}</span> row{good.length === 1 ? '' : 's'} ready
            {bad.length > 0 && <span className="text-red-600 font-bold"> · {bad.length} to fix</span>}
          </div>

          {bad.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-1">
              {/* Named line by line: "the file is invalid" leaves you rereading
                  a spreadsheet looking for which cell it meant. */}
              {bad.map((r: any) => (
                <div key={r.line} className="text-xs text-red-700">
                  <span className="font-mono font-bold">line {r.line}</span> — {r.error}
                </div>
              ))}
              <p className="text-[11px] text-red-500 pt-1">
                Nothing is imported while any line is wrong. Fix these and choose the file again.
              </p>
            </div>
          )}

          {good.length > 0 && (
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-stone-50 text-[10px] uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="text-left px-3 py-2">Ingredient</th>
                    <th className="text-right px-3 py-2">Quantity</th>
                    <th className="text-right px-3 py-2">Paid</th>
                    <th className="text-right px-3 py-2">Per unit</th>
                    <th className="text-left px-3 py-2">Bought</th>
                    <th className="text-left px-3 py-2">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {good.map((r: any) => (
                    <tr key={r.line} className="border-t border-stone-100">
                      <td className="px-3 py-2 font-semibold">{r.name}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {r.qty_base.toLocaleString()} {r.base_unit}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{baht(r.total_cost)}</td>
                      <td className="px-3 py-2 text-right font-mono text-stone-500">
                        {r.cost_per_unit == null ? '—' : `฿${r.cost_per_unit.toFixed(4)}`}
                      </td>
                      <td className="px-3 py-2 text-stone-500">{r.purchased_on}</td>
                      <td className="px-3 py-2 text-stone-500">{r.expires_on || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            type="button"
            disabled={busy || bad.length > 0 || good.length === 0}
            onClick={() => send(csv, true)}
            className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {bad.length > 0 ? `Fix ${bad.length} line${bad.length === 1 ? '' : 's'} first` : `Import ${good.length} purchase${good.length === 1 ? '' : 's'}`}
          </button>
        </div>
      )}
    </Card>
  );
}

function Purchases({ lots, ingredients, run, busy }: any) {
  const blank = { ingredient_id: '', qty: '', bulk: '1', total_cost: '', purchased_on: today(), expires_on: '', note: '' };
  const [form, setForm] = useState(blank);
  const ing = ingredients.find((i: Ingredient) => String(i.id) === form.ingredient_id);

  const add = () => run(async () => {
    await api('/lots', {
      method: 'POST',
      body: JSON.stringify({ ...form, qty: Number(form.qty) * Number(form.bulk || 1) }),
    });
    setForm({ ...blank, purchased_on: form.purchased_on });
  });

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-bold mb-4 flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Record a purchase</h3>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <Field label="Ingredient">
            <select className={input} value={form.ingredient_id}
              onChange={e => setForm({ ...form, ingredient_id: e.target.value })}>
              <option value="">Choose…</option>
              {ingredients.filter((i: Ingredient) => i.active).map((i: Ingredient) =>
                <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </Field>
          <Field label="Quantity">
            <input className={input} type="number" step="any" value={form.qty}
              onChange={e => setForm({ ...form, qty: e.target.value })} />
          </Field>
          <Field label="In">
            {/* Shops buy in kilos and litres but recipes are written in grams
                and millilitres, so the multiplier is offered here rather than
                asking the cook to convert in their head. */}
            <select className={input} value={form.bulk} onChange={e => setForm({ ...form, bulk: e.target.value })}>
              <option value="1">{ing?.unit || 'base unit'}</option>
              {ing?.unit === 'g' && <option value="1000">kg</option>}
              {ing?.unit === 'ml' && <option value="1000">litres</option>}
              {/* Only offered once a pack size is known, otherwise the
                  multiplier would silently be 1 and the cost 300x too high. */}
              {ing?.pack_size ? <option value={String(ing.pack_size)}>
                pack ({ing.pack_size} {ing.unit})
              </option> : null}
            </select>
          </Field>
          <Field label="Total paid ฿">
            <input className={input} type="number" step="0.01" value={form.total_cost}
              onChange={e => setForm({ ...form, total_cost: e.target.value })} />
          </Field>
          <Field label="Bought on">
            <input className={input} type="date" value={form.purchased_on}
              onChange={e => setForm({ ...form, purchased_on: e.target.value })} />
          </Field>
          <Field label="Expires on">
            <input className={input} type="date" value={form.expires_on}
              onChange={e => setForm({ ...form, expires_on: e.target.value })} />
          </Field>
        </div>
        {form.qty && form.total_cost && ing && (
          <p className="text-xs text-stone-600 mt-3">
            = {baht(Number(form.total_cost) / (Number(form.qty) * Number(form.bulk || 1)))} per {ing.unit}
          </p>
        )}
        <button onClick={add} disabled={busy || !form.ingredient_id || !form.qty || form.total_cost === ''}
          className="mt-4 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-bold disabled:opacity-40">
          Record purchase
        </button>
      </Card>

      <ImportPurchases run={run} busy={busy} />

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-[11px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="text-left px-5 py-3">Ingredient</th>
              <th className="text-right px-5 py-3">Left / bought</th>
              <th className="text-right px-5 py-3">Unit cost</th>
              <th className="text-left px-5 py-3">Bought</th>
              <th className="text-left px-5 py-3">Expires</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {lots.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-stone-400">Nothing in stock yet.</td></tr>
            )}
            {lots.map((l: Lot) => (
              <tr key={l.id} className="border-t border-stone-100">
                <td className="px-5 py-3 font-semibold">{l.ingredient_name}</td>
                <td className="px-5 py-3 text-right font-mono">
                  {qty(l.qty_remaining, l.unit)} <span className="text-stone-400">/ {qty(l.qty_purchased, l.unit)}</span>
                </td>
                <td className="px-5 py-3 text-right font-mono">{baht(l.unit_cost)}</td>
                <td className="px-5 py-3 text-stone-500">{l.purchased_on}</td>
                <td className="px-5 py-3">
                  {!l.expires_on ? <span className="text-stone-400">—</span> : (
                    <span className={`font-semibold ${
                      (l.days_left ?? 99) < 0 ? 'text-red-600'
                        : (l.days_left ?? 99) <= 7 ? 'text-amber-600' : 'text-stone-600'}`}>
                      {l.expires_on}
                      {(l.days_left ?? 99) <= 7 && (
                        <span className="ml-1 text-[11px]">
                          ({(l.days_left ?? 0) < 0 ? `${Math.abs(l.days_left ?? 0)}d ago` : `${l.days_left}d`})
                        </span>
                      )}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <button title="Write off what's left"
                    onClick={() => run(() => api(`/lots/${l.id}/waste`, { method: 'POST', body: JSON.stringify({}) }))}
                    className="text-xs font-bold text-stone-400 hover:text-red-600">Write off</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------- recipes ---

function Recipes({ menuItems, ingredients, costs, onChange }: any) {
  const [selected, setSelected] = useState<number | null>(null);
  const [recipe, setRecipe] = useState<any>(null);
  const [line, setLine] = useState({ ingredient_id: '', quantity: '' });
  const [err, setErr] = useState('');

  const load = useCallback(async (id: number) => {
    try { setRecipe(await api(`/recipes/${id}`)); setErr(''); }
    catch (e: any) { setErr(e.message); }
  }, []);
  useEffect(() => { if (selected) load(selected); }, [selected, load]);

  const addLine = async () => {
    try {
      await api(`/recipes/${selected}`, { method: 'POST', body: JSON.stringify(line) });
      setLine({ ingredient_id: '', quantity: '' });
      await load(selected!); onChange();
    } catch (e: any) { setErr(e.message); }
  };
  const removeLine = async (id: number) => {
    await api(`/recipes/line/${id}`, { method: 'DELETE' });
    await load(selected!); onChange();
  };

  const costFor = (id: number) => costs.find((c: Cost) => c.menu_item_id === id);
  const total = recipe?.lines.reduce((s: number, l: any) => s + (l.line_cost || 0), 0) ?? 0;
  const incomplete = recipe?.lines.some((l: any) => l.line_cost == null);

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-4">
      <Card className="!p-0 overflow-hidden max-h-[560px] overflow-y-auto">
        {menuItems.map((m: any) => {
          const c = costFor(m.id);
          return (
            <button key={m.id} onClick={() => setSelected(m.id)}
              className={`w-full text-left px-4 py-3 border-b border-stone-100 hover:bg-stone-50 ${
                selected === m.id ? 'bg-stone-900 text-white hover:bg-stone-900' : ''}`}>
              <div className="text-sm font-semibold flex items-center gap-2">
                {c?.cost_complete && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                {m.name}
              </div>
              <div className={`text-[11px] ${selected === m.id ? 'text-stone-300' : 'text-stone-500'}`}>
                {baht(m.price)} · {c?.has_recipe ? (c.cost_complete ? `costs ${baht(c.cost)}` : 'cost incomplete') : 'no recipe'}
              </div>
            </button>
          );
        })}
      </Card>

      <Card>
        {!selected ? (
          <div className="text-center text-stone-400 py-20">Pick a dish to write its recipe.</div>
        ) : (
          <>
            {err && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{err}</div>}
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <h3 className="font-bold text-lg">{recipe?.item?.name}</h3>
              <div className="text-right">
                <div className="text-xs text-stone-500">sells for {baht(recipe?.item?.price)}</div>
                <div className="text-sm font-bold">
                  {incomplete
                    ? <span className="text-amber-600">ingredients cost at least {baht(total)}</span>
                    : <>costs {baht(total)} · margin {baht((recipe?.item?.price ?? 0) - total)}</>}
                </div>
              </div>
            </div>

            <table className="w-full text-sm mb-4">
              <tbody>
                {recipe?.lines.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-stone-400">No ingredients yet.</td></tr>
                )}
                {recipe?.lines.map((l: any) => (
                  <tr key={l.id} className="border-b border-stone-100">
                    <td className="py-2 font-semibold">
                      {l.name}
                      {/* The question a cook actually asks holding a bag:
                          how many of these does one pack make? */}
                      {(() => {
                        const ing = ingredients.find((i: Ingredient) => i.id === l.ingredient_id);
                        if (!ing?.pack_size || !l.quantity) return null;
                        const servings = ing.pack_size / l.quantity;
                        return (
                          <div className="text-xs font-normal text-stone-400">
                            1 pack ({ing.pack_size} {ing.unit}) = {servings >= 10 ? Math.floor(servings) : servings.toFixed(1)} servings
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-2 text-right font-mono align-top">{qty(l.quantity, l.unit)}</td>
                    <td className="py-2 text-right font-mono">
                      {l.line_cost == null ? <span className="text-amber-600 text-xs font-semibold">not priced</span> : baht(l.line_cost)}
                    </td>
                    <td className="py-2 text-right w-8">
                      <button onClick={() => removeLine(l.id)} className="text-stone-300 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Field label="Ingredient">
                  <select className={input} value={line.ingredient_id}
                    onChange={e => setLine({ ...line, ingredient_id: e.target.value })}>
                    <option value="">Choose…</option>
                    {ingredients.filter((i: Ingredient) => i.active).map((i: Ingredient) =>
                      <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                  </select>
                </Field>
              </div>
              <div className="w-32">
                <Field label="Amount">
                  <input className={input} type="number" step="any" value={line.quantity}
                    onChange={e => setLine({ ...line, quantity: e.target.value })} />
                </Field>
              </div>
              <button onClick={addLine} disabled={!line.ingredient_id || !line.quantity}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-bold disabled:opacity-40">
                Add
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

// -------------------------------------------------------------- food cost ---

function Costs({ rows }: { rows: Cost[] }) {
  // Worst margin first — the whole point of the page is finding the dishes
  // that are quietly losing money.
  const costed = rows.filter(r => r.cost_complete).sort((a, b) => (a.margin_pct ?? 0) - (b.margin_pct ?? 0));
  const rest = rows.filter(r => !r.cost_complete);

  return (
    <Card className="!p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-[11px] uppercase tracking-wide text-stone-500">
          <tr>
            <th className="text-left px-5 py-3">Dish</th>
            <th className="text-right px-5 py-3">Price</th>
            <th className="text-right px-5 py-3">Cost</th>
            <th className="text-right px-5 py-3">Margin</th>
            <th className="text-right px-5 py-3">%</th>
          </tr>
        </thead>
        <tbody>
          {costed.map(r => (
            <tr key={r.menu_item_id} className="border-t border-stone-100">
              <td className="px-5 py-3 font-semibold">{r.name}</td>
              <td className="px-5 py-3 text-right font-mono">{baht(r.price)}</td>
              <td className="px-5 py-3 text-right font-mono">{baht(r.cost)}</td>
              <td className="px-5 py-3 text-right font-mono">{baht(r.margin)}</td>
              <td className={`px-5 py-3 text-right font-mono font-bold ${
                (r.margin_pct ?? 0) < 50 ? 'text-red-600' : (r.margin_pct ?? 0) < 65 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {r.margin_pct == null ? '—' : `${r.margin_pct.toFixed(0)}%`}
              </td>
            </tr>
          ))}
          {rest.length > 0 && (
            <tr className="border-t border-stone-200 bg-stone-50">
              <td colSpan={5} className="px-5 py-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">
                Not costed yet — {rest.length} of {rows.length}
              </td>
            </tr>
          )}
          {rest.map(r => (
            <tr key={r.menu_item_id} className="border-t border-stone-100 text-stone-500">
              <td className="px-5 py-3">
                {r.name}
                <span className="ml-2 text-[11px] text-amber-600 font-semibold">
                  {!r.has_recipe ? 'no recipe' : `missing cost: ${r.missing.join(', ')}`}
                </span>
              </td>
              <td className="px-5 py-3 text-right font-mono">{baht(r.price)}</td>
              <td className="px-5 py-3 text-right font-mono text-xs">
                {r.has_recipe ? `≥ ${baht(r.partial_cost)}` : '—'}
              </td>
              <td className="px-5 py-3 text-right">—</td>
              <td className="px-5 py-3 text-right">—</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
