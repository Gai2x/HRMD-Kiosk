'use client'

import type { Translator } from '../data/translations'
import { formatClock, formatLongDay } from '../lib/format'
import type { Lang } from '../lib/types'
import { Brand, PrototypeNotice } from '../components/Brand'
import { Icon } from '../components/Icons'
import { LanguageToggle } from '../components/LanguageToggle'

/**
 * Attract screen. Deliberately sparse: one instruction, one large action, and
 * the date/time so staff can confirm the kiosk is alive.
 */
export function WelcomeScreen({
  t,
  lang,
  onLangChange,
  onStart,
  now,
}: {
  t: Translator
  lang: Lang
  onLangChange: (lang: Lang) => void
  onStart: () => void
  now: Date | null
}) {
  return (
    <main className="kiosk-backdrop relative flex min-h-screen flex-col overflow-hidden bg-ink text-white">
      <div className="kiosk-grid absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 flex items-center justify-between gap-4 px-6 py-6 lg:px-12">
        <Brand inverse t={t} />
        <div className="flex items-center gap-4">
          <div className="hidden rounded-2xl border border-white/15 bg-white/10 px-5 py-2.5 text-right backdrop-blur sm:block">
            <p className="font-display text-lg font-bold tabular-nums text-white">
              {now ? formatClock(now) : '--:--'}
            </p>
            <p className="text-xs text-white/60">
              {now ? formatLongDay(now) : t('brand.lgu')}
            </p>
          </div>
          <LanguageToggle inverse lang={lang} onChange={onLangChange} t={t} />
        </div>
      </div>

      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-10 text-center">
        <PrototypeNotice dark t={t} />

        <div className="animate-pop mt-8 grid size-28 place-items-center rounded-[2rem] border border-white/15 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          <Icon className="text-brand" name="people" size={54} />
        </div>

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.32em] text-brand">
          {t('brand.dept')}
        </p>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
          {t('welcome.heading')}
        </h1>
        <p className="mt-5 text-xl font-semibold text-white/85 sm:text-2xl">
          {t('welcome.subtitle')}
        </p>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
          {t('welcome.instruction')}
        </p>

        <button
          className="btn mt-10 min-h-20 min-w-[300px] bg-brand px-12 text-xl text-ink shadow-[0_20px_50px_rgba(16,185,129,0.35)] hover:bg-brand-dark hover:text-white"
          onClick={onStart}
          type="button"
        >
          {t('welcome.getStarted')}
          <Icon name="chevronRight" size={28} />
        </button>

        <p className="mt-8 flex items-center gap-2 text-sm text-white/50">
          <Icon name="shield" size={17} />
          {t('welcome.privacy')}
        </p>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-6 py-4 text-center text-sm text-white/45">
        {t('brand.dept')} <span className="mx-2 text-white/20">|</span> {t('brand.lgu')}
      </footer>
    </main>
  )
}
