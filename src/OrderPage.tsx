import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, ShoppingBag, X, Store, Bike, CheckCircle2, Star, ArrowLeft, ArrowRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { NiksenLogo } from './components/NiksenLogo';
import { Lang, LANGS, STRINGS, detectLang, localizedName, localizedCategory, localizedDescription } from './i18n';
import { orderingOpen } from './config';

interface PublicEvent {
  id: number; kind: string;
  title: string; title_th: string | null; title_ru: string | null;
  body: string | null; body_th: string | null; body_ru: string | null;
  starts_on: string | null; ends_on: string | null;
}

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
  // The app is one page with a tab bar rather than five routes: the cart has
  // to survive moving between them, and a customer who reloads mid-order
  // should not lose it to a URL they never chose.
  const [tab, setTab] = useState<'home' | 'menu' | 'order' | 'tonight' | 'card'>('menu');
  const [events, setEvents] = useState<PublicEvent[]>([]);
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
      fetch('/api/public/events').then(r => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([info, items, whatsOn]) => {
      if (info?.shop_name) setShopName(info.shop_name);
      setMenu(Array.isArray(items) ? items : []);
      setEvents(Array.isArray(whatsOn) ? whatsOn : []);
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
      <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-[#141414]/[0.14] max-w-md w-full p-8 text-center space-y-5">
          <CheckCircle2 className="w-16 h-16 text-[#2B4FA8] mx-auto" />
          <div>
            <h1 className="text-2xl font-bold text-[#141414]">{t.orderReceived}</h1>
            <p className="text-[#141414]/55 mt-1">{t.orderWord} <span className="font-mono font-bold">#{result.id}</span> · {orderType === 'pickup' ? t.pickup : t.delivery}</p>
          </div>
          <div className="bg-[#FAF8F3] rounded-[3px] p-4">
            <p className="text-xs text-[#141414]/40 uppercase font-bold tracking-wider">{t.totalTax}</p>
            <p className="text-3xl font-mono font-bold text-[#2B4FA8]">{formatTHB(result.total)}</p>
          </div>
          {result.promptpay ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#141414]/60">{t.scanToPay}</p>
              <div className="bg-white inline-block p-3 rounded-[3px] border-2 border-[#141414]/[0.14]">
                <QRCodeSVG value={result.promptpay} size={180} />
              </div>
              <p className="text-xs text-[#141414]/40">{orderType === 'pickup' ? t.orCashPickup : t.orCashDelivery}</p>
            </div>
          ) : (
            <p className="text-sm text-[#141414]/55">{orderType === 'pickup' ? t.payLaterPickup : t.payLaterDelivery}</p>
          )}
          <div className="bg-amber-50 border border-amber-200 rounded-[3px] p-3 flex items-center gap-3 text-left">
            <Star className="w-6 h-6 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-800">
              {t.earned(result.points_earned, result.member_points)}
            </p>
          </div>
          <button
            onClick={() => setResult(null)}
            className="w-full bg-[#141414] text-white py-3 rounded-[3px] font-bold hover:bg-[#2B2B2B] transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> {t.orderMore}
          </button>
        </div>
      </div>
    );
  }

  return (
    // The ordering page carries the Niksen app's palette rather than the site's
    // warm ivory: cream ground, cobalt for anything you can press, and the ink
    // near-black the app uses instead of pure black. Held to this file so the
    // landing page and the POS are untouched.
    <div className="min-h-screen bg-[#F4F1EA] text-[#141414] pb-28">
      {tab === 'menu' && (<>
      {/* Header */}
      <header className="bg-[#F4F1EA] px-4 pt-5 pb-3 sticky top-0 z-20 border-b border-[#141414]/10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-[-0.02em] leading-none">{t.menuTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => changeLang(l.code)}
                  className={`px-2 py-1 rounded-full text-[11px] font-bold transition-colors ${
                    lang === l.code ? 'bg-[#2B4FA8] text-white' : 'text-[#141414]/45 hover:text-[#141414]'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            {/* The app's mark: black disc, yellow n. */}
            <div className="w-10 h-10 rounded-full bg-[#141414] flex items-center justify-center shrink-0">
              <span className="text-[#F5C518] font-bold text-lg leading-none">n</span>
            </div>
          </div>
        </div>
        {/* Category pills */}
        <div className="max-w-3xl mx-auto mt-3 flex gap-2 overflow-x-auto pb-1">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${
                activeCategory === c
                  ? 'bg-[#2B4FA8] text-white border-[#2B4FA8]'
                  : 'bg-transparent text-[#141414]/65 border-[#141414]/25 hover:border-[#141414]/50'
              }`}
            >
              {c === 'All' ? t.all : localizedCategory(c, lang)}
            </button>
          ))}
        </div>
      </header>

      {/* Opening-soon banner — ordering is disabled until launch */}
      {!canOrder && (
        <div className="bg-[#2B4FA8] text-white text-center text-sm font-bold px-4 py-3">
          {t.openingBanner}
        </div>
      )}

      {/* Menu */}
      <main className="max-w-3xl mx-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 items-stretch">
        {loading && <p className="col-span-full text-center text-[#141414]/40 py-16">{t.loading}</p>}
        {!loading && menu.length === 0 && (
          <p className="col-span-full text-center text-[#141414]/40 py-16">{t.emptyMenu}</p>
        )}
        {visibleMenu.map(item => {
          const configurable = !!(item.option_groups && item.option_groups.length > 0);
          // A configurable item can be in the cart several times with different
          // fillings, so there is no single line to attach +/- to — it always
          // opens the builder instead.
          const line = configurable ? undefined : cart.find(l => l.key === lineKey(item.id, []));
          return (
            /* Two to a row, picture on top, as on the Niksen app's menu. The
               photo does the selling and the words underneath only confirm it,
               so the image gets the height and the text stays out of its way.
               Square corners and a hairline rather than a shadow: the app reads
               as printed matter, and floating cards do not. */
            <div key={item.id} className="bg-white rounded-[3px] border border-[#141414]/[0.14] flex flex-col overflow-hidden">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={localizedName(item, lang)}
                  className="w-full aspect-[4/3] object-cover bg-[#EDE9DF]"
                />
              ) : (
                <div className="w-full aspect-[4/3] bg-[#EDE9DF] flex items-center justify-center text-[#141414]/20">
                  <ShoppingBag className="w-7 h-7" />
                </div>
              )}

              <div className="p-3 flex flex-col flex-1">
                <p className="font-bold text-[14px] leading-tight tracking-[-0.01em]">{localizedName(item, lang)}</p>
                {localizedDescription(item, lang) && (
                  <p className="text-xs text-[#141414]/55 leading-snug line-clamp-2 mt-0.5">{localizedDescription(item, lang)}</p>
                )}

                {/* mt-auto so the price sits on the same line in every card of a
                    row, however long the name above it ran. */}
                <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                  <p className="font-mono text-[15px] leading-none">
                    {configurable && <span className="block text-[10px] font-sans text-[#141414]/45 mb-0.5">{t.from}</span>}
                    {formatTHB(item.price)}
                  </p>

                  {!item.in_stock ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#141414]/40">{t.soldOut}</span>
                  ) : line ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => changeQty(line.key, -1)}
                        aria-label="-"
                        className="w-7 h-7 rounded-full border border-[#141414]/25 hover:border-[#141414] flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-sm w-4 text-center">{line.quantity}</span>
                      <button
                        onClick={() => changeQty(line.key, 1)}
                        aria-label="+"
                        className="w-7 h-7 rounded-full bg-[#2B4FA8] text-white hover:bg-[#24408B] flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      aria-label={configurable ? t.customise : t.addToOrder}
                      title={configurable ? t.customise : t.addToOrder}
                      className="w-8 h-8 rounded-full bg-[#2B4FA8] text-white hover:bg-[#24408B] flex items-center justify-center shrink-0 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </main>
      </>)}

      {tab === 'home' && (
        <>
          {/* The blue block the app opens on: the name, what the place is, and
              whether you can walk in right now. */}
          <header className="bg-[#2B4FA8] text-white px-5 pt-8 pb-9">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-[34px] font-extrabold tracking-[-0.03em] leading-none">NIKSEN</h1>
                <div className="w-12 h-12 rounded-full bg-[#141414] flex items-center justify-center shrink-0">
                  <span className="text-[#F5C518] font-bold text-xl leading-none">n</span>
                </div>
              </div>
              <p className="mt-5 text-[22px] font-semibold leading-[1.25] tracking-[-0.01em] max-w-[22ch]">
                {t.heroLine}
              </p>
              <p className="mt-5 font-mono text-[13px] tracking-[0.14em] text-[#F5C518] uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F5C518] inline-block" />
                {canOrder ? t.openNow : t.openingBanner}
              </p>
            </div>
          </header>

          <main className="max-w-3xl mx-auto p-4 space-y-3">
            {([
              ['menu', t.homeMenu, t.homeMenuSub, false],
              ['order', t.homeOrder, t.homeOrderSub, false],
              // One card is black on the app's home screen — whatever is on
              // tonight is the thing worth looking up from your phone for.
              ['tonight', t.homeTonight, t.homeTonightSub, true],
              ['card', t.homeCard, t.homeCardSub, false],
              ['find', t.homeFind, t.homeFindSub, false],
            ] as const).map(([to, title, sub, dark]) => (
              <button
                key={to}
                onClick={() => to !== 'find' && setTab(to as typeof tab)}
                className={`w-full rounded-[3px] border px-[18px] py-5 flex items-center justify-between gap-4 text-left transition-colors ${
                  dark
                    ? 'bg-[#141414] border-[#141414] text-white'
                    : 'bg-white border-[#141414]/[0.14] hover:border-[#141414]/30'
                }`}
              >
                <span className="min-w-0">
                  <span className="block font-bold text-lg leading-tight tracking-[-0.01em]">{title}</span>
                  <span className={`block text-sm mt-0.5 ${dark ? 'text-white/55' : 'text-[#141414]/55'}`}>{sub}</span>
                </span>
                <ArrowRight className={`w-4 h-4 shrink-0 ${dark ? 'text-[#F5C518]' : 'text-[#2B4FA8]'}`} />
              </button>
            ))}

            <div className="pt-4 space-y-1 font-mono text-[11px] tracking-[0.14em] uppercase text-[#141414]/40">
              <p>{t.hoursBreakfast}</p>
              <p>{t.hoursBar}</p>
              <p>{t.place}</p>
            </div>
          </main>
        </>
      )}

      {tab === 'tonight' && (
        <main className="max-w-3xl mx-auto p-4 pt-8 space-y-3">
          <h2 className="text-3xl font-bold tracking-[-0.02em] mb-1">{t.homeTonight}</h2>
          {events.length === 0 ? (
            /* Nothing pinned up. Say so plainly rather than showing an empty
               page that reads like something failed to load. */
            <div className="bg-white rounded-[3px] border border-[#141414]/[0.14] px-[18px] py-5">
              <p className="text-sm text-[#141414]/70 leading-relaxed">{t.tonightBody}</p>
            </div>
          ) : (
            events.map(e => {
              const title = (lang === 'th' && e.title_th) || (lang === 'ru' && e.title_ru) || e.title;
              const body = (lang === 'th' && e.body_th) || (lang === 'ru' && e.body_ru) || e.body;
              const promo = e.kind === 'promo';
              return (
                <div
                  key={e.id}
                  className={`rounded-[3px] border px-[18px] py-5 ${
                    promo ? 'bg-[#2B4FA8] border-[#2B4FA8] text-white' : 'bg-[#141414] border-[#141414] text-white'
                  }`}
                >
                  <p className="font-mono text-[10px] tracking-[0.14em] uppercase mb-2 text-[#F5C518]">
                    {promo ? t.promoLabel : t.eventLabel}
                    {e.starts_on && <span className="text-white/45"> · {e.starts_on}</span>}
                  </p>
                  <p className="font-bold text-lg leading-tight tracking-[-0.01em]">{title}</p>
                  {body && <p className="text-sm text-white/60 leading-relaxed mt-1.5 whitespace-pre-line">{body}</p>}
                </div>
              );
            })
          )}
        </main>
      )}

      {tab === 'card' && (
        <main className="max-w-3xl mx-auto p-4 pt-8 space-y-4">
          <h2 className="text-3xl font-bold tracking-[-0.02em]">{t.homeCard}</h2>
          <div className="bg-white rounded-[3px] border border-[#141414]/[0.14] px-[18px] py-5 space-y-3">
            <p className="text-sm text-[#141414]/70 leading-relaxed">{t.pointsNote}</p>
            <p className="font-mono text-[13px] tracking-[0.1em] uppercase text-[#141414]/45">{t.homeCardSub}</p>
          </div>
        </main>
      )}

      {tab === 'order' && (
        <main className="max-w-3xl mx-auto p-4 pt-8 space-y-4">
          <h2 className="text-3xl font-bold tracking-[-0.02em]">{t.yourOrder}</h2>
          {cart.length === 0 ? (
            <div className="bg-white rounded-[3px] border border-[#141414]/[0.14] px-[18px] py-8 text-center space-y-3">
              <p className="text-sm text-[#141414]/55">{t.cartEmpty}</p>
              <button onClick={() => setTab('menu')} className="text-[#2B4FA8] font-bold text-sm hover:underline">
                {t.homeMenu}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-[3px] border border-[#141414]/[0.14] px-[18px] py-5">
              <p className="text-sm text-[#141414]/55 mb-4">{t.cartItems(cartCount)}</p>
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full bg-[#2B4FA8] hover:bg-[#24408B] text-white rounded-[3px] py-4 font-bold transition-colors"
              >
                {t.checkout} · {formatTHB(total)}
              </button>
            </div>
          )}
        </main>
      )}

      {/* Tab bar. Monospace and spaced out like the app's, sitting above the
          cart bar so a full basket never hides the way back to the menu. */}
      <nav className="fixed bottom-0 inset-x-0 z-20 bg-[#F4F1EA] border-t border-[#141414]/10 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-3xl mx-auto grid grid-cols-5">
          {([
            ['home', t.navHome],
            ['menu', t.navMenu],
            ['order', t.navOrder],
            ['tonight', t.navTonight],
            ['card', t.navCard],
          ] as const).map(([to, label]) => (
            <button key={to} onClick={() => setTab(to)} className="py-3 flex flex-col items-center gap-1.5">
              {/* A dot marks the tab you are on, not a change of colour — the
                  labels are short and the app does it this way. */}
              <span className={`w-1.5 h-1.5 rounded-full ${tab === to ? 'bg-[#2B4FA8]' : 'bg-transparent'}`} />
              <span className={`font-mono text-[10px] tracking-[0.12em] uppercase ${tab === to ? 'text-[#141414]' : 'text-[#141414]/40'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-[76px] inset-x-0 z-30 px-4 pt-4 pb-3">
          <button
            onClick={() => setShowCheckout(true)}
            className="max-w-3xl mx-auto w-full bg-[#2B4FA8] hover:bg-[#24408B] text-white rounded-[3px] py-4 px-6 font-bold shadow-lg flex items-center justify-between transition-colors"
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
          <div className="bg-white w-full max-w-lg rounded-t-[3px] sm:rounded-3xl max-h-[92vh] overflow-y-auto">
            <div className="p-5 border-b border-[#141414]/10 flex justify-between items-center sticky top-0 bg-white rounded-t-[3px]">
              <h2 className="text-xl font-bold">{t.yourOrder}</h2>
              <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-[#F4F1EA] rounded-[3px]">
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
                        <button onClick={() => changeQty(l.key, -1)} className="w-7 h-7 rounded-lg bg-[#F4F1EA] flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                        <span className="font-bold w-5 text-center">{l.quantity}</span>
                        <button onClick={() => changeQty(l.key, 1)} className="w-7 h-7 rounded-lg bg-[#F4F1EA] flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="font-mono font-bold w-20 text-right">{formatTHB(l.unitPrice * l.quantity)}</span>
                    </div>
                    {l.options.length > 0 && (
                      <p className="text-[11px] text-[#141414]/40 leading-snug mt-0.5 pr-24">
                        {l.options.map(o => localizedName(o, lang)).join(' · ')}
                      </p>
                    )}
                  </div>
                ))}
                <div className="border-t border-[#141414]/10 pt-2 space-y-1 text-sm">
                  <div className="flex justify-between text-[#141414]/55"><span>{t.subtotal}</span><span className="font-mono">{formatTHB(subtotal)}</span></div>
                  <div className="flex justify-between text-[#141414]/55"><span>{t.tax}</span><span className="font-mono">{formatTHB(subtotal * 0.07)}</span></div>
                  <div className="flex justify-between font-bold text-base"><span>{t.total}</span><span className="font-mono text-[#2B4FA8]">{formatTHB(total)}</span></div>
                </div>
              </div>

              {/* Order type */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOrderType('pickup')}
                  className={`py-3 rounded-[3px] font-bold flex items-center justify-center gap-2 border-2 transition-colors ${
                    orderType === 'pickup' ? 'border-[#2B4FA8] bg-[#2B4FA8]/[0.06] text-[#2B4FA8]' : 'border-[#141414]/[0.14] text-[#141414]/55'
                  }`}
                >
                  <Store className="w-4 h-4" /> {t.pickup}
                </button>
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`py-3 rounded-[3px] font-bold flex items-center justify-center gap-2 border-2 transition-colors ${
                    orderType === 'delivery' ? 'border-[#2B4FA8] bg-[#2B4FA8]/[0.06] text-[#2B4FA8]' : 'border-[#141414]/[0.14] text-[#141414]/55'
                  }`}
                >
                  <Bike className="w-4 h-4" /> {t.delivery}
                </button>
              </div>

              {/* Customer details */}
              <div className="space-y-3">
                <input
                  type="text" placeholder={t.namePh}
                  className="w-full px-4 py-3 bg-[#FAF8F3] border border-[#141414]/[0.14] rounded-[3px] focus:outline-none focus:ring-2 focus:ring-[#2B4FA8]"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                />
                <input
                  type="tel" placeholder={t.phonePh}
                  className="w-full px-4 py-3 bg-[#FAF8F3] border border-[#141414]/[0.14] rounded-[3px] focus:outline-none focus:ring-2 focus:ring-[#2B4FA8]"
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                />
                {orderType === 'delivery' && (
                  <textarea
                    placeholder={t.addressPh} rows={2}
                    className="w-full px-4 py-3 bg-[#FAF8F3] border border-[#141414]/[0.14] rounded-[3px] focus:outline-none focus:ring-2 focus:ring-[#2B4FA8]"
                    value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  />
                )}
                <input
                  type="text" placeholder={t.notesPh}
                  className="w-full px-4 py-3 bg-[#FAF8F3] border border-[#141414]/[0.14] rounded-[3px] focus:outline-none focus:ring-2 focus:ring-[#2B4FA8]"
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-[3px] p-3">{error}</p>}

              <button
                onClick={submitOrder}
                disabled={!canOrder || submitting || !form.name || !form.phone || (orderType === 'delivery' && !form.address)}
                className="w-full bg-[#2B4FA8] hover:bg-[#24408B] disabled:bg-[#141414]/15 disabled:text-[#141414]/40 text-white py-4 rounded-[3px] font-bold transition-colors"
              >
                {!canOrder ? t.openingCta : submitting ? t.placing : `${t.placeOrder(orderType === 'pickup' ? t.pickup : t.delivery)} · ${formatTHB(total)}`}
              </button>
              <p className="text-[11px] text-[#141414]/40 text-center">
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
        const countIn = (g: OptionGroup) => g.options.filter(o => builderPicks.has(o.id)).length;
        const toggle = (id: number) => setBuilderPicks(prev => {
          const next = new Set(prev);
          if (next.has(id)) { next.delete(id); return next; }
          // A group that allows one choice should swap, not refuse: tapping a
          // second base is a change of mind, and making the customer untick
          // the first one is a small insult on a phone.
          const group = groups.find(g => g.options.some(o => o.id === id));
          if (group && group.max_select !== null) {
            const chosen = group.options.filter(o => next.has(o.id));
            if (chosen.length >= group.max_select) {
              if (group.max_select === 1) next.delete(chosen[0].id);
              else return prev;
            }
          }
          next.add(id);
          return next;
        });
        // The same rule the server enforces, said before the customer commits
        // rather than after: an order rejected at checkout has already wasted
        // their time.
        const unmet = groups.find(g => countIn(g) < g.min_select);
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setBuilderItem(null)}>
            <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-[3px] max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-[#141414]/10 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-2xl leading-tight">{localizedName(builderItem, lang)}</h2>
                  <p className="text-xs text-[#141414]/55 mt-1">{t.chooseIngredients}</p>
                </div>
                <button onClick={() => setBuilderItem(null)} className="w-9 h-9 rounded-full bg-[#F4F1EA] flex items-center justify-center shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-3">
                {groups.map(g => (
                  <div key={g.id} className="py-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#141414]/40 mb-2">{localizedName(g, lang)}</p>
                    <div className="space-y-1">
                      {g.options.map(o => {
                        const on = builderPicks.has(o.id);
                        return (
                          <button
                            key={o.id}
                            onClick={() => toggle(o.id)}
                            className={`w-full text-left flex items-center gap-3 rounded-[3px] px-3 py-2.5 border transition-colors ${
                              on ? 'bg-[#2B4FA8]/[0.06] border-[#2B4FA8]/40' : 'bg-white border-[#141414]/[0.14] hover:bg-[#FAF8F3]'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                              on ? 'bg-[#2B4FA8] border-[#2B4FA8]' : 'border-[#141414]/25'
                            }`}>
                              {on && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block font-semibold text-sm leading-tight">{localizedName(o, lang)}</span>
                              {(o.kcal !== null || o.grams !== null) && (
                                <span className="block text-[11px] text-[#141414]/40">
                                  {[o.kcal !== null && `${o.kcal} kcal`, o.protein !== null && `P ${o.protein}`, o.grams !== null && `${o.grams} g`]
                                    .filter(Boolean).join(' · ')}
                                </span>
                              )}
                            </span>
                            <span className="font-mono text-sm text-[#141414]/55 shrink-0">+{formatTHB(o.price)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-[#141414]/10 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#141414]/55">
                  <span>{picked.length > 0 ? `${kcal} kcal · P ${protein.toFixed(1)} g` : ' '}</span>
                  {picked.length > 0 && (
                    <button onClick={() => setBuilderPicks(new Set())} className="underline hover:text-[#141414]">{t.clearAll}</button>
                  )}
                </div>
                <button
                  onClick={() => { addLine(builderItem, picked); setBuilderItem(null); }}
                  disabled={!!unmet}
                  className="w-full bg-[#2B4FA8] hover:bg-[#24408B] text-white py-4 rounded-[3px] font-bold flex items-center justify-center gap-2 disabled:bg-[#141414]/20 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {unmet
                    ? `${t.choose} ${localizedName(unmet, lang)}`
                    : `${t.add} · ${formatTHB(builderItem.price + addedPrice)}`}
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
