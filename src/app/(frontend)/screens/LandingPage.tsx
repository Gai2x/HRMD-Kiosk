'use client'

import type { Translator } from '../data/translations'
import { formatClock, formatLongDay } from '../lib/format'
import type { Lang } from '../lib/types'
import { Icon } from '../components/Icons'
import { LanguageToggle } from '../components/LanguageToggle'
import { NetworkBackground } from '../components/NetworkBackground'
import { RequestCard } from '../components/RequestCard'
import { REQUEST_TYPES } from '../data/requestTypes'

/**
 * Kiosk landing / service selection screen.
 *
 * Single-screen layout on kiosk monitors: the branding lockup, heading and all
 * six service tiles live inside the viewport, with the live clock and the
 * language switch parked at the far right as plain white text.
 *
 * The background is the shared animated pastel network — a gentle lavender,
 * cyan and pink gradient with drifting network lines — rather than the static
 * office backdrop image.
 */
export function LandingPage({
  t,
  lang,
  onLangChange,
  onSelect,
  onTrack,
  onCancel,
  now,
}: {
  t: Translator
  lang: Lang
  onLangChange: (lang: Lang) => void
  onSelect: (service: string) => void
  onTrack: () => void
  onCancel: () => void
  now: Date | null
}) {
  return (
    <main className="relative flex min-h-dvh flex-col bg-ink text-white lg:h-dvh lg:overflow-y-auto">
      {/* Animated pastel network gradient — shared landing / admin identity. */}
      <NetworkBackground className="absolute inset-0 h-full w-full" />

      {/* Subtle grid pattern — keeps the office feel without the photo. */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
        aria-hidden="true"
      />

      {/* Soft scrim to keep white text readable without darkening the gradient. */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/6"
        aria-hidden="true"
      />

      {/* Live date/time + language: plain text, far right, no decorative cards. */}
      <header className="relative z-10 flex w-full flex-wrap items-center justify-end gap-x-4 gap-y-1 px-4 pt-4 sm:px-6 lg:px-10">
        <div className="text-right leading-tight">
          <p className="font-display text-base font-bold tabular-nums text-white sm:text-lg">
            {now ? formatClock(now) : '--:--'}
          </p>
          <p className="text-[0.7rem] font-semibold text-white/70 sm:text-xs">
            {now ? formatLongDay(now) : t('brand.lgu')}
          </p>
        </div>
        <LanguageToggle inverse lang={lang} onChange={onLangChange} t={t} variant="bare" />
      </header>

      {/* Single-screen content column. */}
      <section className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-5 pt-3 sm:px-6 lg:px-10">
        {/* Branding lockup: official seal + HRMD logo + wordmark. */}
        <div className="flex shrink-0 items-center justify-center gap-3 sm:gap-5">
          <div
            aria-label="Lungsod ng Tanjay city seal"
            className="size-14 shrink-0 overflow-hidden rounded-full shadow-xl ring-1 ring-white/25 sm:size-20"
          >
            <img
              alt=""
              className="size-full object-contain"
              src="/Branding/tanjay-seal-cropped.png"
            />
          </div>
          <div
            aria-label="HRMD logo"
            className="relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-white/70 bg-white/10 shadow-lg sm:size-20"
          >
            <img
              alt="HRMD logo"
              className="block h-full w-full object-contain"
              height={80}
              src="/hr.jpg"
              width={80}
            />
          </div>
          <div
            aria-label="Human Resource Management Division of the City Government of Tanjay"
            className="flex flex-col text-left leading-none"
          >
            <span
              className="font-display text-[1.7rem] font-black tracking-tight text-white sm:text-4xl"
              style={{ textShadow: '0 1px 0 #0008, 0 2px 4px #0004' }}
            >
              HRMD
            </span>
            <span className="mt-1 font-display text-[0.6rem] font-bold tracking-[0.25em] text-white/90 sm:text-xs">
              LGU TANJAY CITY
            </span>
          </div>
        </div>

        {/* Main heading. */}
        <h1 className="mt-3 text-center font-display text-[clamp(1.35rem,1.05rem+1.5vw,2.5rem)] font-extrabold leading-tight tracking-tight text-white sm:mt-4">
          {t('welcome.heading')}
        </h1>
        <p className="mt-1.5 text-center text-[clamp(0.85rem,0.78rem+0.4vw,1.15rem)] font-semibold text-white/80">
          {t('welcome.subtitle')}
        </p>

        {/* Services. */}
        <p className="mb-2.5 mt-4 text-center text-[0.68rem] font-bold uppercase tracking-[0.24em] text-white/55 sm:text-xs">
          {t('selection.title')}
        </p>

        <div className="grid w-full max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {REQUEST_TYPES.map((config) => (
            <RequestCard
              config={config}
              dense
              key={config.id}
              onSelect={() => onSelect(config.id)}
              selected={false}
              t={t}
            />
          ))}
        </div>

        {/* Tracking + demo notice. */}
        <div className="mt-4 flex w-full max-w-6xl flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
          <button
            className="btn btn-secondary shrink-0 border-white/25 bg-white/10 px-5 text-white hover:border-white/40 hover:bg-white/20"
            onClick={onTrack}
            type="button"
          >
            <Icon name="search" size={19} />
            {t('selection.trackTitle')}
          </button>
          <p className="text-center text-xs text-white/55">{t('selection.demoNote')}</p>
        </div>
      </section>
    </main>
  )
}
