import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { NiksenLogo } from './components/NiksenLogo';
import { Lang, LANGS, detectLang } from './i18n';
import { JOURNAL } from './journalStrings';

const LOCALES: Record<Lang, string> = { en: 'en-GB', th: 'th-TH', ru: 'ru-RU' };

const JournalPage: React.FC = () => {
  const [lang, setLang] = useState<Lang>(detectLang());
  const c = JOURNAL[lang];

  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem('niksen_lang', l);
  };

  useEffect(() => {
    document.title = c.metaTitle;
  }, [c.metaTitle]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(LOCALES[lang], { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200/70 bg-stone-50/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <a href="/" className="shrink-0"><NiksenLogo variant="blue" size="sm" /></a>
          <div className="flex-1" />
          <div className="flex items-center gap-1 bg-stone-200/60 rounded-full p-1">
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => changeLang(l.code)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                  lang === l.code ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-14 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">{c.kicker}</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl tracking-tight">{c.pageTitle}</h1>
        <p className="mt-3 text-stone-500">{c.intro}</p>

        <div className="mt-12 space-y-16">
          {c.posts.map(post => (
            <article key={post.slug} id={post.slug} className="scroll-mt-24">
              <time dateTime={post.date} className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                {formatDate(post.date)}
              </time>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl tracking-tight leading-tight">{post.title}</h2>
              {/* Generous leading and a narrow measure — these entries are meant
                  to be read slowly, which is the whole point of the place. */}
              <div className="mt-6 space-y-5">
                {post.body.map((p, i) => (
                  <p key={i} className="text-lg leading-loose text-stone-700">{p}</p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-20 pt-8 border-t border-stone-200 flex flex-wrap gap-3">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-stone-600 hover:text-stone-900 px-4 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {c.home}
          </a>
          <a
            href="/order"
            className="inline-flex items-center gap-2 text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 px-4 py-2.5 rounded-full transition-colors"
          >
            <ShoppingBag className="w-4 h-4" /> {c.order}
          </a>
        </div>
      </main>
    </div>
  );
};

export default JournalPage;
