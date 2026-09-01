import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';

// Choices a customer makes on a configurable dish — the base of a bowl, the
// milk in a coffee. The data model has always supported them; until this panel
// existed only a seed script could write them, so the one configurable item on
// the live menu shipped with nothing to choose.

type Option = {
  id: number; name: string; name_th: string | null; name_ru: string | null;
  price: number; kcal: number | null; protein: number | null; grams: number | null;
  available: boolean;
};
type Group = {
  id: number; name: string; name_th: string | null; name_ru: string | null;
  min_select: number; max_select: number | null; options: Option[];
};

const field = 'w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';
const label = 'block text-[11px] font-bold text-stone-400 uppercase mb-1';

export default function MenuOptionsEditor({ menuItemId, itemName }: { menuItemId: number; itemName: string }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState({ name: '', name_th: '', min_select: '0', max_select: '' });
  const [newOption, setNewOption] = useState<Record<number, { name: string; name_th: string; price: string }>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/menu/${menuItemId}/option-groups`);
      if (res.ok) setGroups(await res.json());
    } finally {
      setLoading(false);
    }
  }, [menuItemId]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  // Every write goes through here so a rejected one says why instead of
  // failing silently — the reason a staff member can act on is in the body.
  const run = async (url: string, init: RequestInit) => {
    setBusy(true); setError(null);
    try {
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `That didn't save (HTTP ${res.status}).`);
        return false;
      }
      await load();
      return true;
    } catch {
      setError('Could not reach the server. Check the connection and try again.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addGroup = async () => {
    if (!newGroup.name.trim()) return;
    const ok = await run(`/api/menu/${menuItemId}/option-groups`, {
      method: 'POST',
      body: JSON.stringify({
        name: newGroup.name,
        name_th: newGroup.name_th || null,
        min_select: newGroup.min_select,
        max_select: newGroup.max_select,
      }),
    });
    if (ok) setNewGroup({ name: '', name_th: '', min_select: '0', max_select: '' });
  };

  const addOption = async (groupId: number) => {
    const form = newOption[groupId];
    if (!form?.name.trim()) return;
    const ok = await run(`/api/option-groups/${groupId}/options`, {
      method: 'POST',
      body: JSON.stringify({ name: form.name, name_th: form.name_th || null, price: form.price || 0 }),
    });
    if (ok) setNewOption(p => ({ ...p, [groupId]: { name: '', name_th: '', price: '' } }));
  };

  if (loading) {
    return (
      <div className="mt-6 pt-6 border-t border-stone-200 text-sm text-stone-400 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading choices…
      </div>
    );
  }

  return (
    <div className="mt-6 pt-6 border-t border-stone-200">
      <div className="flex items-baseline justify-between mb-1">
        <h4 className="font-bold text-stone-800">Customer choices</h4>
        {busy && <Loader2 className="w-4 h-4 animate-spin text-stone-400" />}
      </div>
      <p className="text-[11px] text-stone-400 mb-4">
        What a customer picks when ordering “{itemName}” — a base, a size, extra toppings.
        Leave this empty for a dish that is served one way.
      </p>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-medium">{error}</div>
      )}

      <div className="space-y-4">
        {groups.map(g => (
          <div key={g.id} className="border border-stone-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 bg-stone-50">
              <div className="min-w-0">
                <div className="font-bold text-sm truncate">
                  {g.name}
                  {g.name_th && <span className="ml-2 font-normal text-stone-400">{g.name_th}</span>}
                </div>
                <div className="text-[11px] text-stone-400">
                  {/* Spelled out rather than "1–1": staff read this to check what
                      the customer will actually be asked. */}
                  {g.min_select === 0 && g.max_select === null && 'optional · any number'}
                  {g.min_select === 0 && g.max_select !== null && `optional · up to ${g.max_select}`}
                  {g.min_select > 0 && g.max_select === g.min_select && `must pick exactly ${g.min_select}`}
                  {g.min_select > 0 && g.max_select !== null && g.max_select !== g.min_select && `pick ${g.min_select}–${g.max_select}`}
                  {g.min_select > 0 && g.max_select === null && `pick at least ${g.min_select}`}
                </div>
              </div>
              <button
                type="button"
                title="Delete this choice group and everything in it"
                onClick={() => {
                  if (!confirm(`Delete "${g.name}" and its ${g.options.length} choice(s)?\nPast receipts keep what was ordered.`)) return;
                  run(`/api/option-groups/${g.id}`, { method: 'DELETE' });
                }}
                className="shrink-0 p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {g.options.map(o => (
                <div key={o.id} className="flex items-center gap-2 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm truncate ${o.available ? '' : 'text-stone-400 line-through'}`}>
                      {o.name}
                      {o.name_th && <span className="ml-2 text-stone-400">{o.name_th}</span>}
                    </div>
                  </div>
                  <span className="font-mono text-sm text-stone-600 shrink-0">
                    {o.price > 0 ? `+฿${o.price}` : '฿0'}
                  </span>
                  <button
                    type="button"
                    title={o.available ? 'Mark sold out — hides it from customers' : 'Put it back on the menu'}
                    onClick={() => run(`/api/options/${o.id}`, { method: 'PATCH', body: JSON.stringify({ available: !o.available }) })}
                    className={`shrink-0 px-2 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      o.available ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
                  >
                    {o.available ? 'On' : 'Sold out'}
                  </button>
                  <button
                    type="button"
                    title="Delete this choice"
                    onClick={() => {
                      if (!confirm(`Delete the choice "${o.name}"?`)) return;
                      run(`/api/options/${o.id}`, { method: 'DELETE' });
                    }}
                    className="shrink-0 p-1.5 text-stone-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {g.options.length === 0 && (
                <div className="px-4 py-2.5 text-xs text-amber-600">
                  No choices yet — a group with nothing in it shows the customer an empty list.
                </div>
              )}
            </div>

            <div className="flex gap-2 px-4 py-3 bg-white border-t border-stone-100">
              <input
                className={field} placeholder="Choice, e.g. Quinoa"
                value={newOption[g.id]?.name || ''}
                onChange={e => setNewOption(p => ({ ...p, [g.id]: { ...(p[g.id] || { name: '', name_th: '', price: '' }), name: e.target.value } }))}
              />
              <input
                className={field} placeholder="ไทย"
                value={newOption[g.id]?.name_th || ''}
                onChange={e => setNewOption(p => ({ ...p, [g.id]: { ...(p[g.id] || { name: '', name_th: '', price: '' }), name_th: e.target.value } }))}
              />
              <input
                className={`${field} w-28`} type="number" min={0} placeholder="+฿0"
                value={newOption[g.id]?.price || ''}
                onChange={e => setNewOption(p => ({ ...p, [g.id]: { ...(p[g.id] || { name: '', name_th: '', price: '' }), price: e.target.value } }))}
              />
              <button
                type="button" onClick={() => addOption(g.id)} disabled={busy}
                className="shrink-0 px-4 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-stone-800 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 border border-dashed border-stone-300 rounded-2xl">
        <div className="text-[11px] font-bold text-stone-400 uppercase mb-3">Add a choice group</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={label}>Group name</label>
            <input className={field} placeholder="e.g. Base, Size, Toppings"
              value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} />
          </div>
          <div>
            <label className={label}>ชื่อไทย</label>
            <input className={field} placeholder="เช่น ฐาน, ขนาด"
              value={newGroup.name_th} onChange={e => setNewGroup({ ...newGroup, name_th: e.target.value })} />
          </div>
          <div>
            <label className={label}>Must pick at least</label>
            <input className={field} type="number" min={0}
              value={newGroup.min_select} onChange={e => setNewGroup({ ...newGroup, min_select: e.target.value })} />
          </div>
          <div>
            <label className={label}>At most (blank = no limit)</label>
            <input className={field} type="number" min={1} placeholder="no limit"
              value={newGroup.max_select} onChange={e => setNewGroup({ ...newGroup, max_select: e.target.value })} />
          </div>
        </div>
        <button
          type="button" onClick={addGroup} disabled={busy || !newGroup.name.trim()}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-600 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Add group
        </button>
      </div>
    </div>
  );
}
