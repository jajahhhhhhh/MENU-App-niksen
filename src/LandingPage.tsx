import React, { useState, useEffect } from 'react';
import {
  Coffee, Leaf, Moon, MapPin, Clock, Star, ShoppingBag, ArrowRight,
  ArrowUpRight, Instagram, Facebook, Menu as MenuIcon,
  X, Navigation, Sparkles, Check, Phone,
} from 'lucide-react';
import { NiksenLogo } from './components/NiksenLogo';
import { Lang, LANGS, detectLang } from './i18n';
import { LANDING } from './landingStrings';
import { COMPANY } from './privacyStrings';

// --- Editable links -----------------------------------------------------
// Replace the "#" placeholders with real handles when they go live.
const ORDER_URL = '/order';
// LOCATION — exact pin from the owner's Google Maps (lat,lng). Flows to both
// links below: the embed drops a marker here; the button opens Maps at this point.
// Preview zoom 17 keeps nearby roads visible so guests can orient in Bophut.
const MAP_COORDS = '9.530061,100.061278';
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${MAP_COORDS}`;
const MAP_EMBED = `https://www.google.com/maps?q=${MAP_COORDS}&z=17&output=embed`;
// Real http(s) URLs render as active icons; '#' stays inactive / "coming soon".
const SOCIALS = {
  instagram: 'https://www.instagram.com/niksen.ch/',
  facebook: 'https://www.facebook.com/profile.php?id=61585081873147',
  pinterest: 'https://www.pinterest.com/howtoniksen/',
  // LINE Official Account @037zxllt — add-friend deep link (opens the app on mobile).
  line: 'https://line.me/R/ti/p/@037zxllt',
};
const DELIVERY: { name: string; href: string }[] = [
  { name: 'Grab', href: 'https://r.grab.com/o/n6fAfaQf' },
  { name: 'LINE MAN', href: '#' },
  { name: 'foodpanda', href: '#' },
];

const isLive = (href: string) => /^https?:\/\//.test(href);

const PILLAR_ICON = { coffee: Coffee, leaf: Leaf, moon: Moon } as const;

// lucide has no Pinterest glyph — minimal brand mark, inherits currentColor like the rest.
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
  </svg>
);

// lucide has no LINE glyph either — official speech-bubble mark, same treatment.
const LineIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

const LandingPage: React.FC = () => {
  const [lang, setLang] = useState<Lang>(detectLang());
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = LANDING[lang];

  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem('niksen_lang', l);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Deep-link scroll: if the page loads with a #hash (e.g. a shared /#visit), jump to it.
  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) requestAnimationFrame(() => el.scrollIntoView());
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const navLinks = [
    { href: '#story', label: t.navStory },
    { href: '#menu', label: t.navMenu },
    { href: '#rewards', label: t.navRewards },
    { href: '#visit', label: t.navVisit },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-200 selection:text-emerald-900 overflow-x-hidden">
      {/* ---------------- Nav ---------------- */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-stone-50/85 backdrop-blur-md border-b border-stone-200/70 shadow-sm' : 'bg-transparent'
        }`}
      >
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a href="#top" className="shrink-0" aria-label="niksen secret bar">
            <NiksenLogo variant="blue" size="md" />
          </a>

          <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-stone-600">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} className="hover:text-stone-900 transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* language switcher */}
            <div className="hidden sm:flex gap-0.5 bg-stone-200/70 p-1 rounded-full">
              {LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => changeLang(l.code)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                    lang === l.code ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <a
              href={ORDER_URL}
              className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-4 py-2 rounded-full transition-colors"
            >
              <ShoppingBag className="w-4 h-4" /> {t.order}
            </a>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden p-2 -mr-2 text-stone-700"
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* mobile drawer */}
        {menuOpen && (
          <div className="md:hidden bg-stone-50/95 backdrop-blur-md border-b border-stone-200 px-6 py-4 space-y-1">
            {navLinks.map(l => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2.5 text-base font-semibold text-stone-700"
              >
                {l.label}
              </a>
            ))}
            <div className="flex items-center justify-between pt-3">
              <div className="flex gap-1 bg-stone-200/70 p-1 rounded-full">
                {LANGS.map(l => (
                  <button
                    key={l.code}
                    onClick={() => changeLang(l.code)}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      lang === l.code ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <a
                href={ORDER_URL}
                className="inline-flex items-center gap-1.5 bg-emerald-500 text-white font-bold text-sm px-4 py-2 rounded-full"
              >
                <ShoppingBag className="w-4 h-4" /> {t.order}
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ---------------- Hero ---------------- */}
      <section id="top" className="relative pt-28 pb-20 sm:pt-36 sm:pb-28">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-24 -right-24 w-[32rem] h-[32rem] rounded-full bg-emerald-200/45 blur-3xl" />
          <div className="absolute top-40 -left-32 w-[28rem] h-[28rem] rounded-full bg-amber-200/40 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-stone-200 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> {t.heroBadge}
            </span>
            <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight text-stone-900">
              {t.heroTitleA}{' '}
              <span className="italic text-emerald-600">{t.heroTitleEm}</span>
            </h1>
            <p className="mt-6 text-lg text-stone-600 max-w-xl leading-relaxed">{t.heroSub}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={ORDER_URL}
                className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-bold px-6 py-3.5 rounded-full transition-colors shadow-lg shadow-stone-900/10"
              >
                <ShoppingBag className="w-5 h-5" /> {t.heroCta}
              </a>
              <a
                href="#visit"
                className="inline-flex items-center gap-2 bg-white hover:bg-stone-100 text-stone-900 font-bold px-6 py-3.5 rounded-full border border-stone-200 transition-colors"
              >
                <MapPin className="w-5 h-5" /> {t.heroCta2}
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-stone-500">
              <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-600" /> {t.heroLocation}</span>
              <span className="inline-flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-600" /> {t.heroHours}</span>
            </div>
          </div>

          {/* hero card — scan-to-order (QR → /order), replaces the old info card */}
          <div className="relative">
            <div className="absolute -inset-3 bg-gradient-to-tr from-emerald-300/30 to-amber-200/30 blur-2xl rounded-[2.5rem]" aria-hidden />
            <a
              href={ORDER_URL}
              className="relative block rounded-[2rem] bg-stone-100 border border-stone-200 p-8 sm:p-10 shadow-2xl shadow-stone-900/10 text-center transition-transform hover:-translate-y-0.5"
            >
              <div className="flex justify-center">
                <NiksenLogo variant="blue" size="md" />
              </div>
              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">{t.heroLocation}</p>
              <p className="mt-2 font-display text-4xl sm:text-5xl tracking-tight text-stone-900">Scan to order</p>
              <p className="mt-2 text-sm text-stone-500">สแกนเพื่อสั่ง · Отсканируйте, чтобы заказать</p>
              <div className="mx-auto mt-6 w-52 sm:w-60 rounded-3xl bg-white p-4 shadow-lg shadow-stone-900/5">
                <img src="/qr-order.svg" alt="QR code — order at niksensamui.com/order" className="w-full h-auto" />
              </div>
              <p className="mt-5 font-mono font-bold text-emerald-700">niksensamui.com/order</p>
              <p className="mt-2 text-xs font-semibold text-stone-400">{t.heroCardHours}</p>
            </a>
          </div>
        </div>
      </section>

      {/* ---------------- Marquee strip ---------------- */}
      <div className="border-y border-stone-200 bg-white/60 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-stone-500">
          {t.strip.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-6">
              {i > 0 && <span className="text-emerald-400" aria-hidden>•</span>}
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* ---------------- Story ---------------- */}
      <section id="story" className="scroll-mt-20 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">{t.storyKicker}</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl tracking-tight text-stone-900">{t.storyTitle}</h2>
            <p className="mt-6 text-lg text-stone-600 leading-relaxed">{t.storyP1}</p>
            <p className="mt-4 text-lg text-stone-600 leading-relaxed">{t.storyP2}</p>
          </div>
          <div className="relative">
            <div className="rounded-[2rem] bg-white border border-stone-200 shadow-xl shadow-stone-200/50 p-10 sm:p-12">
              <Moon className="w-9 h-9 text-emerald-500" />
              <blockquote className="mt-6 font-display text-3xl sm:text-4xl leading-snug text-stone-800 italic">
                “{t.storyQuote}”
              </blockquote>
              <p className="mt-6 text-sm font-semibold text-stone-400">{t.storyQuoteBy}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Pillars ---------------- */}
      <section className="py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">{t.pillarsKicker}</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl tracking-tight text-stone-900">{t.pillarsTitle}</h2>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {t.pillars.map((p, i) => {
              const Icon = PILLAR_ICON[p.icon];
              return (
                <div
                  key={i}
                  className="group rounded-3xl bg-white border border-stone-200 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-stone-900">{p.title}</h3>
                  <p className="mt-3 text-stone-600 leading-relaxed">{p.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- Menu highlights ---------------- */}
      <section id="menu" className="scroll-mt-20 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">{t.menuKicker}</p>
              <h2 className="mt-3 font-display text-4xl sm:text-5xl tracking-tight text-stone-900">{t.menuTitle}</h2>
              <p className="mt-4 text-lg text-stone-600 leading-relaxed">{t.menuSub}</p>
            </div>
            <a
              href={ORDER_URL}
              className="hidden sm:inline-flex items-center gap-2 shrink-0 text-emerald-700 font-bold hover:gap-3 transition-all"
            >
              {t.menuCta} <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {t.menuItems.map((item, i) => (
              <div key={i} className="rounded-3xl bg-white border border-stone-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-stone-100 to-emerald-50 flex items-center justify-center text-4xl">
                  {item.emoji}
                </div>
                <h3 className="mt-5 text-lg font-bold text-stone-900">{item.name}</h3>
                <p className="mt-1.5 text-sm text-stone-500 leading-relaxed">{item.note}</p>
                <p className="mt-4 font-mono font-bold text-emerald-600">{item.price}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-stone-100 border border-stone-200 px-5 py-4">
            <p className="text-sm text-stone-500 inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" /> {t.menuSample}
            </p>
            <a
              href={ORDER_URL}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-full transition-colors whitespace-nowrap"
            >
              {t.menuCta} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ---------------- Rewards ---------------- */}
      <section id="rewards" className="scroll-mt-20 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-[2.5rem] bg-gradient-to-br from-stone-900 via-stone-900 to-emerald-950 text-white overflow-hidden">
            <div className="absolute -top-20 -right-16 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden />
            <div className="relative grid lg:grid-cols-2 gap-10 p-10 sm:p-16 items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">{t.rewardsKicker}</p>
                <h2 className="mt-3 font-display text-4xl sm:text-5xl tracking-tight">{t.rewardsTitle}</h2>
                <p className="mt-5 text-lg text-stone-300 leading-relaxed max-w-md">{t.rewardsBody}</p>
                <a
                  href={ORDER_URL}
                  className="mt-8 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-3.5 rounded-full transition-colors"
                >
                  <Star className="w-5 h-5" /> {t.rewardsCta}
                </a>
              </div>
              <ul className="space-y-4">
                {t.rewardsPoints.map((p, i) => (
                  <li key={i} className="flex items-center gap-4 rounded-2xl bg-white/5 border border-white/10 px-5 py-4">
                    <span className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5" />
                    </span>
                    <span className="font-semibold text-stone-100">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Private events (whole-venue buyout) ---------------- */}
      <section id="private" className="scroll-mt-20 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">{t.privateKicker}</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl tracking-tight text-stone-900">{t.privateTitle}</h2>
            <p className="mt-5 text-lg text-stone-600 leading-relaxed max-w-md">{t.privateBody}</p>
            <a
              href={`tel:${COMPANY.phone.replace(/\s+/g, '')}`}
              className="mt-8 inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-bold px-6 py-3.5 rounded-full transition-colors"
            >
              <Phone className="w-5 h-5" /> {t.privateCta}
            </a>
          </div>
          <ul className="space-y-4">
            {t.privatePoints.map((p, i) => (
              <li key={i} className="flex items-center gap-4 rounded-2xl bg-white border border-stone-200 px-5 py-4 shadow-sm">
                <span className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5" />
                </span>
                <span className="font-semibold text-stone-700">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------- Visit ---------------- */}
      <section id="visit" className="scroll-mt-20 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">{t.visitKicker}</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl tracking-tight text-stone-900">{t.visitTitle}</h2>

            <dl className="mt-8 space-y-5">
              <div className="flex gap-4">
                <dt className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <MapPin className="w-5 h-5" />
                </dt>
                <dd>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{t.visitAddressLabel}</p>
                  <p className="mt-0.5 font-semibold text-stone-800">{t.visitAddress}</p>
                </dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Clock className="w-5 h-5" />
                </dt>
                <dd>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{t.visitHoursLabel}</p>
                  <p className="mt-0.5 font-semibold text-stone-800">{t.visitHours}</p>
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-bold px-5 py-3 rounded-full transition-colors"
              >
                <Navigation className="w-4 h-4" /> {t.visitDirections}
              </a>
              <a
                href={ORDER_URL}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-3 rounded-full transition-colors"
              >
                <ShoppingBag className="w-4 h-4" /> {t.order}
              </a>
            </div>

            {/* delivery partners */}
            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{t.visitAlsoOn}</p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {DELIVERY.map(d => (
                  isLive(d.href) ? (
                    <a
                      key={d.name}
                      href={d.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 hover:border-emerald-400 hover:text-emerald-700 transition-colors"
                    >
                      {d.name} <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span
                      key={d.name}
                      className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-100 px-4 py-2 text-sm font-bold text-stone-400"
                    >
                      {d.name}
                      <span className="text-[10px] uppercase tracking-wide bg-stone-200 text-stone-500 px-1.5 py-0.5 rounded-full">{t.soon}</span>
                    </span>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* live map */}
          <div className="relative rounded-[2rem] overflow-hidden border border-stone-200 shadow-xl shadow-stone-200/50 aspect-[4/3] bg-stone-100">
            <iframe
              title="niksen secret bar — location on Google Maps"
              src={MAP_EMBED}
              className="absolute inset-0 w-full h-full"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur px-3.5 py-2 rounded-full text-sm font-bold text-stone-800 shadow-lg hover:bg-white transition-colors"
            >
              <Navigation className="w-4 h-4 text-emerald-600" /> {t.visitDirections}
            </a>
          </div>
        </div>
      </section>

      {/* ---------------- CTA band ---------------- */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="rounded-[2.5rem] bg-emerald-500 text-white px-8 py-14 sm:px-16 sm:py-20 text-center relative overflow-hidden">
            <div className="absolute -bottom-16 -left-10 w-72 h-72 rounded-full bg-emerald-400/50 blur-2xl" aria-hidden />
            <div className="relative">
              <h2 className="font-display text-4xl sm:text-6xl tracking-tight">{t.ctaTitle}</h2>
              <p className="mt-4 text-lg font-medium text-emerald-950/80 max-w-xl mx-auto">{t.ctaSub}</p>
              <a
                href={ORDER_URL}
                className="mt-8 inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-bold px-8 py-4 rounded-full transition-colors shadow-xl"
              >
                <ShoppingBag className="w-5 h-5" /> {t.ctaButton}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Socials ---------------- */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">{t.socialKicker}</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl tracking-tight text-stone-900">{t.socialTitle}</h2>
          <p className="mt-3 text-stone-500">{t.socialSub}</p>
          <div className="mt-7 flex justify-center gap-3">
            {[
              { icon: Instagram, href: SOCIALS.instagram, label: 'Instagram' },
              { icon: Facebook, href: SOCIALS.facebook, label: 'Facebook' },
              { icon: PinterestIcon, href: SOCIALS.pinterest, label: 'Pinterest' },
              { icon: LineIcon, href: SOCIALS.line, label: 'LINE' },
            ].map(({ icon: Icon, href, label }) => (
              isLive(href) ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-900 hover:text-white transition-colors shadow-sm"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ) : (
                <span
                  key={label}
                  aria-label={`${label} (${t.soon})`}
                  className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-300"
                >
                  <Icon className="w-5 h-5" />
                </span>
              )
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="bg-stone-900 text-stone-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <NiksenLogo variant="white" size="md" />
              <p className="mt-4 text-sm text-stone-400 leading-relaxed max-w-xs">{t.footerTagline}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{t.footerExplore}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><a href="#story" className="hover:text-white transition-colors">{t.navStory}</a></li>
                <li><a href="#menu" className="hover:text-white transition-colors">{t.navMenu}</a></li>
                <li><a href="#visit" className="hover:text-white transition-colors">{t.navVisit}</a></li>
                <li><a href={ORDER_URL} className="hover:text-white transition-colors">{t.order}</a></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{t.footerLegal}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><a href="/privacy" className="hover:text-white transition-colors">{t.privacy}</a></li>
                <li><a href="/offer" className="hover:text-white transition-colors">{t.offer}</a></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{t.footerConnect}</p>
              <div className="mt-4 flex gap-2.5">
                {[
                  { icon: Instagram, href: SOCIALS.instagram, label: 'Instagram' },
                  { icon: Facebook, href: SOCIALS.facebook, label: 'Facebook' },
                  { icon: PinterestIcon, href: SOCIALS.pinterest, label: 'Pinterest' },
                  { icon: LineIcon, href: SOCIALS.line, label: 'LINE' },
                ].map(({ icon: Icon, href, label }) => (
                  isLive(href) ? (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="w-10 h-10 rounded-xl bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-300 transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ) : (
                    <span
                      key={label}
                      aria-label={`${label} — coming soon`}
                      className="w-10 h-10 rounded-xl bg-stone-800/40 flex items-center justify-center text-stone-600"
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                  )
                ))}
              </div>
              <a
                href={`tel:${COMPANY.phone.replace(/\s+/g, '')}`}
                className="mt-5 text-sm text-stone-300 hover:text-white inline-flex items-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-500" /> {COMPANY.phone}
              </a>
              <p className="mt-2 text-sm text-stone-400 inline-flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" /> {t.heroLocation}
              </p>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-stone-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-stone-500">
            <p>© 2026 niksen secret bar. {t.rights}</p>
            <p className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {t.heroHours}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
