import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';

// What goes on the ordering app's Tonight tab: the film on the wall, a month's
// offer on breakfast. Deliberately small — a title, some words and optional
// dates. Anything richer would be a CMS, and the thing this replaces is a
// chalkboard by the door.

type Notice = {
  id: number; kind: 'event' | 'promo';
  title: string; title_th: string | null; title_ru: string | null;
  body: string | null; body_th: string | null; body_ru: string | null;
  starts_on: string | null; ends_on: string | null;
  active: number;
};

const field = 'w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';
const label = 'block text-[11px] font-bold text-stone-400 uppercase mb-1';
const today = () => new Date().toISOString().slice(0, 10);

const blank = {
  kind: 'event' as 'event' | 'promo',
  title: '', title_th: '', body: '', body_th: '',
  starts_on: today(), ends_on: '',
};

export default function TonightPanel() {
  const [rows, setRows] = useState<Notice[]>([]);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) setRows(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Every write reports why it failed rather than going quiet — the reason is
  // in the body and it is the only thing that tells staff what to change.
  const run = async (url: string, init: RequestInit) => {
    setBusy(true); setError(null);
    try {
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
      if (!res.ok) {
        setError((await res.json().catch(() => ({}))).error || `That didn't save (HTTP ${res.status}).`);
        return false;
      }
      await load();
      return true;
    } catch {
      setError('Could not reach the server.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    if (!form.title.trim()) return;
    const ok = await run('/api/events', { method: 'POST', body: JSON.stringify(form) });
    if (ok) setForm({ ...blank, kind: form.kind });
  };

  const live = (n: Notice) => {
    // Mirrors what the public endpoint will actually return, so the list says
    // what a customer sees rather than what was typed.
    const d = today();
    return !!n.active && (!n.starts_on || n.starts_on <= d) && (!n.ends_on || n.ends_on >= d);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-stone-200 p-5">
        <h3 className="font-bold mb-1">Tonight &amp; offers</h3>
        <p className="text-[11px] text-stone-400 mb-4">
          Shows on the ordering app under <span className="font-bold">Tonight</span>. Anything switched off, or
          outside its dates, disappears from the app on its own — nobody has to remember to take it down.
        </p>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-medium">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex gap-2">
            {(['event', 'promo'] as const).map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setForm({ ...form, kind: k })}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  form.kind === k ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {k === 'event' ? 'On the wall' : 'Offer'}
              </button>
            ))}
          </div>
          <div>
            <label className={label}>Title (EN)</label>
            <input className={field} placeholder="e.g. Wong Kar-wai double bill"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className={label}>ชื่อไทย</label>
            <input className={field} placeholder="เช่น หว่องกาไวสองเรื่องรวด"
              value={form.title_th} onChange={e => setForm({ ...form, title_th: e.target.value })} />
          </div>
          <div>
            <label className={label}>Details (EN)</label>
            <textarea rows={2} className={`${field} resize-y`} placeholder="Free entrance, starts 20:00"
              value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
          </div>
          <div>
            <label className={label}>รายละเอียด (ไทย)</label>
            <textarea rows={2} className={`${field} resize-y`} placeholder="เข้าฟรี เริ่มสองทุ่ม"
              value={form.body_th} onChange={e => setForm({ ...form, body_th: e.target.value })} />
          </div>
          <div>
            <label className={label}>Shows from</label>
            <input className={field} type="date"
              value={form.starts_on} onChange={e => setForm({ ...form, starts_on: e.target.value })} />
          </div>
          <div>
            <label className={label}>Until (blank = no end)</label>
            <input className={field} type="date"
              value={form.ends_on} onChange={e => setForm({ ...form, ends_on: e.target.value })} />
          </div>
        </div>

        <button
          type="button" onClick={add} disabled={busy || !form.title.trim()}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Put it up
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-stone-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-stone-400">Nothing up yet. The app shows a standing line until you add something.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {rows.map(n => (
              <div key={n.id} className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      n.kind === 'promo' ? 'bg-amber-50 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>
                      {n.kind === 'promo' ? 'Offer' : 'On the wall'}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${live(n) ? 'text-emerald-600' : 'text-stone-400'}`}>
                      {live(n) ? 'Live now' : n.active ? 'Out of date' : 'Hidden'}
                    </span>
                  </div>
                  <p className="font-bold mt-1 leading-tight">{n.title}</p>
                  {n.title_th && <p className="text-sm text-stone-500">{n.title_th}</p>}
                  {n.body && <p className="text-xs text-stone-500 mt-1 whitespace-pre-line">{n.body}</p>}
                  <p className="text-[11px] text-stone-400 mt-1 font-mono">
                    {n.starts_on || '—'} → {n.ends_on || '∞'}
                  </p>
                </div>
                <button
                  type="button"
                  title={n.active ? 'Hide it from the app' : 'Show it again'}
                  onClick={() => run(`/api/events/${n.id}`, { method: 'PATCH', body: JSON.stringify({ active: !n.active }) })}
                  className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg"
                >
                  {n.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  title="Delete"
                  onClick={() => {
                    if (!confirm(`Delete "${n.title}"?`)) return;
                    run(`/api/events/${n.id}`, { method: 'DELETE' });
                  }}
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
