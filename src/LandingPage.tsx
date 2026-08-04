import React, { useState, useEffect } from 'react';
import {
  Coffee, Leaf, Moon, MapPin, Clock, Star, ShoppingBag, ArrowRight,
  ArrowUpRight, Instagram, Facebook, MessageCircle, Menu as MenuIcon,
  X, Navigation, Sparkles, Check,
} from 'lucide-react';
import { NiksenLogo } from './components/NiksenLogo';
import { Lang, LANGS, detectLang } from './i18n';
import { LANDING } from './landingStrings';

// --- Editable links -----------------------------------------------------
// Replace the "#" placeholders with real handles when they go live.
const ORDER_URL = '/order';
const POS_URL = '/pos';
const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Bophut%2C%20Koh%20Samui';
// Instagram wired from the handle @niksen_ch. Add Facebook / LINE links when live
// (real http(s) URLs render as active icons; '#' stays inactive / "Coming soon").
const SOCIALS = {
  instagram: 'https://instagram.com/niksen_ch',
  facebook: '#',
  line: '#',
};
const DELIVERY: { name: string; href: string }[] = [
  { name: 'Grab', href: '#' },
  { name: 'LINE MAN', href: '#' },
  { name: 'foodpanda', href: '#' },
];

const isLive = (href: string) => /^https?:\/\//.test(href);

const PILLAR_ICON = { coffee: Coffee, leaf: Leaf, moon: Moon } as const;

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
              className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-stone-900 font-bold text-sm px-4 py-2 rounded-full transition-colors"
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
                className="inline-flex items-center gap-1.5 bg-emerald-500 text-stone-900 font-bold text-sm px-4 py-2 rounded-full"
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

          {/* hero card */}
          <div className="relative">
            <div className="absolute -inset-3 bg-gradient-to-tr from-emerald-300/30 to-amber-200/30 blur-2xl rounded-[2.5rem]" aria-hidden />
            <div className="relative rounded-[2rem] bg-gradient-to-br from-emerald-700 via-emerald-800 to-stone-900 text-white p-8 sm:p-10 shadow-2xl shadow-emerald-900/25 overflow-hidden">
              <div className="absolute -bottom-10 -right-8 opacity-10" aria-hidden>
                <Coffee className="w-48 h-48" strokeWidth={1} />
              </div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <NiksenLogo variant="white" size="md" showSubtitle={false} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">est. 2026</span>
                </div>
                <p className="mt-8 text-emerald-300/90 text-xs font-bold uppercase tracking-[0.18em]">{t.heroCardLabel}</p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center gap-3 border-t border-white/10 pt-3">
                    <Clock className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span className="text-stone-200">{t.heroCardHours}</span>
                  </div>
                  <div className="flex items-center gap-3 border-t border-white/10 pt-3">
                    <MapPin className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span className="text-stone-200">{t.heroLocation}</span>
                  </div>
                  <div className="flex items-center gap-3 border-t border-white/10 pt-3">
                    <Coffee className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span className="text-stone-200">{t.heroCardNote}</span>
                  </div>
                </div>
              </div>
            </div>
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
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-stone-900 font-bold px-5 py-2.5 rounded-full transition-colors whitespace-nowrap"
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
                  className="mt-8 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-stone-900 font-bold px-6 py-3.5 rounded-full transition-colors"
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
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-stone-900 font-bold px-5 py-3 rounded-full transition-colors"
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

          {/* stylized map card */}
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block rounded-[2rem] overflow-hidden border border-stone-200 shadow-xl shadow-stone-200/50 aspect-[4/3] bg-emerald-50"
          >
            <div
              className="absolute inset-0 opacity-70"
              style={{
                backgroundImage:
                  'linear-gradient(120deg, #ecfdf5 0%, #d1fae5 40%, #fef3c7 100%)',
              }}
              aria-hidden
            />
            {/* faux map lines */}
            <svg className="absolute inset-0 w-full h-full text-emerald-600/25" fill="none" aria-hidden>
              <path d="M-20 60 Q200 10 420 120 T820 100" stroke="currentColor" strokeWidth="8" />
              <path d="M60 -20 Q120 200 40 420" stroke="currentColor" strokeWidth="6" />
              <path d="M-20 240 Q260 220 520 320 T900 300" stroke="currentColor" strokeWidth="5" />
              <path d="M300 -20 Q360 180 300 460" stroke="currentColor" strokeWidth="6" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <span className="relative flex items-center justify-center">
                <span className="absolute w-14 h-14 rounded-full bg-emerald-500/25 animate-ping" />
                <span className="relative w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-lg">
                  <MapPin className="w-6 h-6" />
                </span>
              </span>
              <p className="mt-4 font-bold text-stone-800">{t.heroLocation}</p>
              <p className="mt-1 text-sm font-semibold text-emerald-700 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                {t.mapHint} <ArrowUpRight className="w-4 h-4" />
              </p>
            </div>
          </a>
        </div>
      </section>

      {/* ---------------- CTA band ---------------- */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="rounded-[2.5rem] bg-emerald-500 text-stone-900 px-8 py-14 sm:px-16 sm:py-20 text-center relative overflow-hidden">
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
              { icon: MessageCircle, href: SOCIALS.line, label: 'LINE' },
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
                <li><a href={POS_URL} className="hover:text-white transition-colors">{t.staff}</a></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{t.footerConnect}</p>
              <div className="mt-4 flex gap-2.5">
                {[
                  { icon: Instagram, href: SOCIALS.instagram, label: 'Instagram' },
                  { icon: Facebook, href: SOCIALS.facebook, label: 'Facebook' },
                  { icon: MessageCircle, href: SOCIALS.line, label: 'LINE' },
                ].map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={isLive(href) ? href : '#'}
                    {...(isLive(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    aria-label={label}
                    className="w-10 h-10 rounded-xl bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-300 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
              <p className="mt-5 text-sm text-stone-400 inline-flex items-center gap-2">
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
