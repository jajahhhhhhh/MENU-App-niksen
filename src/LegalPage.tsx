import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, ShoppingBag, Mail, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NiksenLogo } from './components/NiksenLogo';
import { Lang, LANGS, detectLang } from './i18n';

export interface LegalSection {
  id: string;
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  link?: { href: string; label: string };
}

export interface LegalContent {
  pageTitle: string;
  home: string;
  order: string;
  effectiveLabel: string;
  tocLabel: string;
  intro: string[];
  sections: LegalSection[];
}

export interface DetailRow {
  label: string;
  value: string;
  icon?: LucideIcon;
  kind?: 'text' | 'email' | 'phone';
}

interface LegalPageProps {
  content: Record<Lang, LegalContent>;
  effectiveDate: string;
  titleIcon: LucideIcon;
  /** sectionId → rows rendered as a details card after that section (localized per language) */
  detailBlocks?: (lang: Lang) => Record<string, DetailRow[]>;
}

const isPlaceholder = (v: string) => /[[\]]/.test(v);

const DetailCard: React.FC<{ rows: DetailRow[] }> = ({ rows }) => (
  <div className="mt-5 rounded-2xl bg-white border border-stone-200 p-5 sm:p-6">
    <dl className="space-y-3 text-sm">
      {rows.map((row, i) => {
        const Icon = row.icon;
        return (
          <div key={i} className={`flex gap-3 ${i > 0 ? 'border-t border-stone-100 pt-3' : ''}`}>
            <dt className="w-28 shrink-0 font-semibold text-stone-400">{row.label}</dt>
            <dd className="min-w-0 break-words">
              {row.kind === 'email' && !isPlaceholder(row.value) ? (
                <a href={`mailto:${row.value}`} className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" /> {row.value}
                </a>
              ) : row.kind === 'phone' && !isPlaceholder(row.value) ? (
                <a href={`tel:${row.value.replace(/\s+/g, '')}`} className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0" /> {row.value}
                </a>
              ) : (
                <span className={`inline-flex items-center gap-2 ${Icon ? 'font-semibold text-stone-800' : 'text-stone-700'}`}>
                  {Icon ? <Icon className="w-4 h-4 text-emerald-600 shrink-0" /> : null}
                  {row.value}
                </span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  </div>
);

const LegalPage: React.FC<LegalPageProps> = ({ content, effectiveDate, titleIcon: TitleIcon, detailBlocks }) => {
  const [lang, setLang] = useState<Lang>(detectLang());
  const t = content[lang];
  const blocks = detailBlocks ? detailBlocks(lang) : {};

  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem('niksen_lang', l);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `${t.pageTitle} · niksen secret bar`;
  }, [lang, t.pageTitle]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-stone-50/85 backdrop-blur-md border-b border-stone-200/70">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a href="/" aria-label="niksen secret bar" className="shrink-0">
            <NiksenLogo variant="blue" size="md" />
          </a>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex gap-0.5 bg-stone-200/70 p-1 rounded-full">
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
              href="/order"
              className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-stone-900 font-bold text-sm px-3 sm:px-4 py-2 rounded-full transition-colors"
            >
              <ShoppingBag className="w-4 h-4" /> <span className="hidden sm:inline">{t.order}</span>
            </a>
          </div>
        </nav>
      </header>

      {/* Title */}
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <a href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-stone-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t.home}
          </a>
          <div className="mt-5 flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TitleIcon className="w-6 h-6" />
            </span>
            <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-stone-900">{t.pageTitle}</h1>
          </div>
          <p className="mt-4 text-sm font-semibold text-stone-400">
            {t.effectiveLabel}: {effectiveDate}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid lg:grid-cols-[220px_1fr] gap-10 lg:gap-14">
        {/* TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{t.tocLabel}</p>
            <nav className="mt-4 space-y-1.5 border-l border-stone-200">
              {t.sections.map(s => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block -ml-px border-l-2 border-transparent hover:border-emerald-400 pl-4 py-0.5 text-sm text-stone-500 hover:text-stone-900 transition-colors"
                >
                  {s.heading}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <article className="max-w-2xl">
          <div className="space-y-4 text-stone-600 leading-relaxed">
            {t.intro.map((p, i) => (
              <p key={i} className={i === 0 ? 'text-lg text-stone-700' : ''}>{p}</p>
            ))}
          </div>

          <div className="mt-12 space-y-11">
            {t.sections.map(s => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-xl font-bold text-stone-900">{s.heading}</h2>

                {s.paragraphs?.map((p, i) => (
                  <p key={i} className="mt-3 text-stone-600 leading-relaxed">{p}</p>
                ))}

                {s.bullets && (
                  <ul className="mt-4 space-y-2.5">
                    {s.bullets.map((b, i) => (
                      <li key={i} className="flex gap-3 text-stone-600 leading-relaxed">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {s.link && (
                  <a
                    href={s.link.href}
                    className="mt-4 inline-flex items-center gap-1.5 text-emerald-700 font-bold hover:gap-2.5 transition-all"
                  >
                    {s.link.label} <ArrowRight className="w-4 h-4" />
                  </a>
                )}

                {blocks[s.id] && <DetailCard rows={blocks[s.id]} />}
              </section>
            ))}
          </div>
        </article>
      </div>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <NiksenLogo variant="white" size="sm" />
          <div className="flex items-center gap-6 text-sm">
            <a href="/" className="hover:text-white transition-colors">{t.home}</a>
            <a href="/order" className="hover:text-white transition-colors">{t.order}</a>
          </div>
          <p className="text-xs text-stone-500">© 2026 niksen secret bar</p>
        </div>
      </footer>
    </div>
  );
};

export default LegalPage;
