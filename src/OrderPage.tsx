import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, ShoppingBag, X, Store, Bike, CheckCircle2, Star, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { NiksenLogo } from './components/NiksenLogo';
import { Lang, LANGS, STRINGS, detectLang, localizedName, localizedCategory, localizedDescription } from './i18n';
import { orderingOpen } from './config';

interface PublicMenuItem {
  id: number;
  name: string;
  name_th?: string | null;
  name_ru?: string | null;
  description?: string | null;
  description_th?: string | null;
  description_ru?: string | null;
  category: string;
  price: number;
  image_url?: string;
  in_stock: boolean;
  option_groups?: OptionGroup[] | null;
}

interface MenuOption {
  id: number;
  name: string;
  name_th?: string | null;
  name_ru?: string | null;
  price: number;
  kcal: number | null;
  protein: number | null;
  grams: number | null;
}

interface OptionGroup {
  id: number;
  name: string;
  name_th?: string | null;
  name_ru?: string | null;
  min_select: number;
  max_select: number | null;
  options: MenuOption[];
}

interface CartLine {
  /** Two bowls with different fillings are different lines, so the item id
   *  alone can't identify one — the chosen options are part of the identity. */
  key: string;
  item: PublicMenuItem;
  quantity: number;
  options: MenuOption[];
  /** Base price plus the chosen options. The server recomputes this from
   *  option ids on checkout; this copy only drives the on-screen total. */
  unitPrice: number;
}

const lineKey = (itemId: number, optionIds: number[]) =>
  `${itemId}:${[...optionIds].sort((a, b) => a - b).join(',')}`;

interface OrderResult {
  id: number;
  total: number;
  points_earned: number;
  member_points: number;
  promptpay: string | null;
}

const formatTHB = (n: number) =>
  `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const OrderPage: React.FC = () => {
  const [shopName, setShopName] = useState('Niksen');
  const [menu, setMenu] = useState<PublicMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [builderItem, setBuilderItem] = useState<PublicMenuItem | null>(null);
  const [builderPicks, setBuilderPicks] = useState<Set<number>>(new Set());
  const [lang, setLang] = useState<Lang>(detectLang());
  const t = STRINGS[lang];
  const canOrder = orderingOpen();

  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem('niksen_lang', l);
  };

  useEffect(() => {
    document.title = 'Order online · niksen secret bar — café in Bophut, Koh Samui';
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/info').then(r => r.json()).catch(() => ({})),
      fetch('/api/public/menu').then(r => r.json()).catch(() => []),
    ]).then(([info, items]) => {
      if (info?.shop_name) setShopName(info.shop_name);
      setMenu(Array.isArray(items) ? items : []);
      setLoading(false);
    });
  }, []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(menu.map(i => i.category)))],
    [menu]
  );

  const visibleMenu = menu.filter(i => activeCategory === 'All' || i.category === activeCategory);

  const cartCount = cart.reduce((s, l) => s + l.quantity, 0);
  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const total = subtotal * 1.07;

  const addLine = (item: PublicMenuItem, options: MenuOption[]) => {
    const key = lineKey(item.id, options.map(o => o.id));
    const unitPrice = item.price + options.reduce((s, o) => s + o.price, 0);
    setCart(prev => {
      const existing = prev.find(l => l.key === key);
      if (existing) return prev.map(l => l.key === key ? { ...l, quantity: l.quantity + 1 } : l);
      return [...prev, { key, item, quantity: 1, options, unitPrice }];
    });
  };

  /** Configurable items open the builder; everything else goes straight in. */
  const addToCart = (item: PublicMenuItem) => {
    if (item.option_groups && item.option_groups.length > 0) {
      setBuilderItem(item);
      setBuilderPicks(new Set());
      return;
    }
    addLine(item, []);
  };

  const changeQty = (key: string, delta: number) => {
    setCart(prev => prev
      .map(l => l.key === key ? { ...l, quantity: l.quantity + delta } : l)
      .filter(l => l.quantity > 0));
  };

  const submitOrder = async () => {
    if (!canOrder) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(l => ({
            menu_item_id: l.item.id,
            quantity: l.quantity,
            options: l.options.length ? l.options.map(o => o.id) : undefined,
          })),
          order_type: orderType,
          customer_name: form.name,
          customer_phone: form.phone,
          delivery_address: orderType === 'delivery' ? form.address : undefined,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.errGeneric);
      } else {
        setResult(data);
        setCart([]);
        setShowCheckout(false);
      }
    } catch {
      setError(t.errNetwork);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Confirmation screen ----
  if (result) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-stone-200 max-w-md w-full p-8 text-center space-y-5">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
          <div>
            <h1 className="text-2xl font-bold text-stone-900">{t.orderReceived}</h1>
            <p className="text-stone-500 mt-1">{t.orderWord} <span className="font-mono font-bold">#{result.id}</span> · {orderType === 'pickup' ? t.pickup : t.delivery}</p>
          </div>
          <div className="bg-stone-50 rounded-2xl p-4">
            <p className="text-xs text-stone-400 uppercase font-bold tracking-wider">{t.totalTax}</p>
            <p className="text-3xl font-mono font-bold text-emerald-600">{formatTHB(result.total)}</p>
          </div>
          {result.promptpay ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-stone-600">{t.scanToPay}</p>
              <div className="bg-white inline-block p-3 rounded-2xl border-2 border-stone-200">
                <QRCodeSVG value={result.promptpay} size={180} />
              </div>
              <p className="text-xs text-stone-400">{orderType === 'pickup' ? t.orCashPickup : t.orCashDelivery}</p>
            </div>
          ) : (
            <p className="text-sm text-stone-500">{orderType === 'pickup' ? t.payLaterPickup : t.payLaterDelivery}</p>
          )}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-3 text-left">
            <Star className="w-6 h-6 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-800">
              {t.earned(result.points_earned, result.member_points)}
            </p>
          </div>
          <button
            onClick={() => setResult(null)}
            className="w-full bg-stone-900 text-white py-3 rounded-2xl font-bold hover:bg-stone-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> {t.orderMore}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-28">
      {/* Header */}
      <header className="bg-stone-900 text-stone-100 px-4 py-4 sticky top-0 z-20 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-stone-800 border border-stone-700/80 px-3 py-1.5 rounded-2xl">
              <NiksenLogo variant="white" size="sm" />
            </div>
            <div>
              <p className="font-bold leading-tight">{shopName}</p>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">{t.tagline}</p>
            </div>
          </div>
          <div className="flex gap-1 bg-stone-800 p-1 rounded-xl">
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => changeLang(l.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  lang === l.code ? 'bg-emerald-500 text-white' : 'text-stone-300 hover:bg-stone-700'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        {/* Category pills */}
        <div className="max-w-3xl mx-auto mt-3 flex gap-2 overflow-x-auto pb-1">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                activeCategory === c ? 'bg-emerald-500 text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              {c === 'All' ? t.all : localizedCategory(c, lang)}
            </button>
          ))}
        </div>
      </header>

      {/* Opening-soon banner — ordering is disabled until launch */}
      {!canOrder && (
        <div className="bg-emerald-500 text-white text-center text-sm font-bold px-4 py-3">
          {t.openingBanner}
        </div>
      )}

      {/* Menu */}
      <main className="max-w-3xl mx-auto p-4 space-y-3">
        {loading && <p className="text-center text-stone-400 py-16">{t.loading}</p>}
        {!loading && menu.length === 0 && (
          <p className="text-center text-stone-400 py-16">{t.emptyMenu}</p>
        )}
        {visibleMenu.map(item => {
          const configurable = !!(item.option_groups && item.option_groups.length > 0);
          // A configurable item can be in the cart several times with different
          // fillings, so there is no single line to attach +/- to — it always
          // opens the builder instead.
          const line = configurable ? undefined : cart.find(l => l.key === lineKey(item.id, []));
          return (
            <div key={item.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 flex items-center gap-4">
              {item.image_url ? (
                <img src={item.image_url} alt={localizedName(item, lang)} className="w-16 h-16 rounded-xl object-cover bg-stone-100" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-stone-100 flex items-center justify-center text-stone-300">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold leading-tight">{localizedName(item, lang)}</p>
                {localizedDescription(item, lang) && (
                  <p className="text-xs text-stone-500 leading-snug line-clamp-2 mt-0.5">{localizedDescription(item, lang)}</p>
                )}
                <p className="text-[11px] text-stone-400 mt-0.5">{localizedCategory(item.category, lang)}</p>
                <p className="font-mono font-bold text-emerald-600 mt-0.5">
                  {configurable && <span className="text-xs font-sans font-normal text-stone-400 mr-1">{t.from}</span>}
                  {formatTHB(item.price)}
                </p>
              </div>
              {!item.in_stock ? (
                <span className="text-xs font-bold text-red-400 bg-red-50 px-3 py-1.5 rounded-full">{t.soldOut}</span>
              ) : line ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => changeQty(line.key, -1)} className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold w-6 text-center">{line.quantity}</span>
                  <button onClick={() => changeQty(line.key, 1)} className="w-9 h-9 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(item)}
                  className="bg-stone-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-stone-700 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" /> {configurable ? t.customise : t.add}
                </button>
              )}
            </div>
          );
        })}
      </main>

      {/* Cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={() => setShowCheckout(true)}
            className="max-w-3xl mx-auto w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-4 px-6 font-bold shadow-2xl flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              {t.cartItems(cartCount)}
            </span>
            <span className="font-mono">{t.checkout} · {formatTHB(total)}</span>
          </button>
        </div>
      )}

      {/* Checkout sheet */}
      {showCheckout && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto">
            <div className="p-5 border-b border-stone-100 flex justify-between items-center sticky top-0 bg-white rounded-t-3xl">
              <h2 className="text-xl font-bold">{t.yourOrder}</h2>
              <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-stone-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 pt-5 space-y-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
              {/* Cart lines */}
              <div className="space-y-2">
                {cart.map(l => (
                  <div key={l.key} className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="flex-1 truncate">{localizedName(l.item, lang)}</span>
                      <div className="flex items-center gap-2 mx-3">
                        <button onClick={() => changeQty(l.key, -1)} className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                        <span className="font-bold w-5 text-center">{l.quantity}</span>
                        <button onClick={() => changeQty(l.key, 1)} className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="font-mono font-bold w-20 text-right">{formatTHB(l.unitPrice * l.quantity)}</span>
                    </div>
                    {l.options.length > 0 && (
                      <p className="text-[11px] text-stone-400 leading-snug mt-0.5 pr-24">
                        {l.options.map(o => localizedName(o, lang)).join(' · ')}
                      </p>
                    )}
                  </div>
                ))}
                <div className="border-t border-stone-100 pt-2 space-y-1 text-sm">
                  <div className="flex justify-between text-stone-500"><span>{t.subtotal}</span><span className="font-mono">{formatTHB(subtotal)}</span></div>
                  <div className="flex justify-between text-stone-500"><span>{t.tax}</span><span className="font-mono">{formatTHB(subtotal * 0.07)}</span></div>
                  <div className="flex justify-between font-bold text-base"><span>{t.total}</span><span className="font-mono text-emerald-600">{formatTHB(total)}</span></div>
                </div>
              </div>

              {/* Order type */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOrderType('pickup')}
                  className={`py-3 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-colors ${
                    orderType === 'pickup' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-200 text-stone-500'
                  }`}
                >
                  <Store className="w-4 h-4" /> {t.pickup}
                </button>
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`py-3 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-colors ${
                    orderType === 'delivery' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-200 text-stone-500'
                  }`}
                >
                  <Bike className="w-4 h-4" /> {t.delivery}
                </button>
              </div>

              {/* Customer details */}
              <div className="space-y-3">
                <input
                  type="text" placeholder={t.namePh}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                />
                <input
                  type="tel" placeholder={t.phonePh}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                />
                {orderType === 'delivery' && (
                  <textarea
                    placeholder={t.addressPh} rows={2}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  />
                )}
                <input
                  type="text" placeholder={t.notesPh}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

              <button
                onClick={submitOrder}
                disabled={!canOrder || submitting || !form.name || !form.phone || (orderType === 'delivery' && !form.address)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-200 disabled:text-stone-400 text-white py-4 rounded-2xl font-bold transition-colors"
              >
                {!canOrder ? t.openingCta : submitting ? t.placing : `${t.placeOrder(orderType === 'pickup' ? t.pickup : t.delivery)} · ${formatTHB(total)}`}
              </button>
              <p className="text-[11px] text-stone-400 text-center">
                {t.pointsNote}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bowl builder */}
      {builderItem && (() => {
        const groups = builderItem.option_groups || [];
        const picked = groups.flatMap(g => g.options.filter(o => builderPicks.has(o.id)));
        const addedPrice = picked.reduce((s, o) => s + o.price, 0);
        const kcal = picked.reduce((s, o) => s + (o.kcal || 0), 0);
        const protein = picked.reduce((s, o) => s + (o.protein || 0), 0);
        const toggle = (id: number) => setBuilderPicks(prev => {
          const next = new Set(prev);
          next.has(id) ? next.delete(id) : next.add(id);
          return next;
        });
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setBuilderItem(null)}>
            <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-stone-100 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-2xl leading-tight">{localizedName(builderItem, lang)}</h2>
                  <p className="text-xs text-stone-500 mt-1">{t.chooseIngredients}</p>
                </div>
                <button onClick={() => setBuilderItem(null)} className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-3">
                {groups.map(g => (
                  <div key={g.id} className="py-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">{localizedName(g, lang)}</p>
                    <div className="space-y-1">
                      {g.options.map(o => {
                        const on = builderPicks.has(o.id);
                        return (
                          <button
                            key={o.id}
                            onClick={() => toggle(o.id)}
                            className={`w-full text-left flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-colors ${
                              on ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                              on ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300'
                            }`}>
                              {on && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block font-semibold text-sm leading-tight">{localizedName(o, lang)}</span>
                              {(o.kcal !== null || o.grams !== null) && (
                                <span className="block text-[11px] text-stone-400">
                                  {[o.kcal !== null && `${o.kcal} kcal`, o.protein !== null && `P ${o.protein}`, o.grams !== null && `${o.grams} g`]
                                    .filter(Boolean).join(' · ')}
                                </span>
                              )}
                            </span>
                            <span className="font-mono text-sm text-stone-500 shrink-0">+{formatTHB(o.price)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>{picked.length > 0 ? `${kcal} kcal · P ${protein.toFixed(1)} g` : ' '}</span>
                  {picked.length > 0 && (
                    <button onClick={() => setBuilderPicks(new Set())} className="underline hover:text-stone-700">{t.clearAll}</button>
                  )}
                </div>
                <button
                  onClick={() => { addLine(builderItem, picked); setBuilderItem(null); }}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {t.add} · {formatTHB(builderItem.price + addedPrice)}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default OrderPage;
