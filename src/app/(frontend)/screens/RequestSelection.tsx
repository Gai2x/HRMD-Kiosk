'use client'

import { REQUEST_TYPES } from '../data/requestTypes'
import type { Translator } from '../data/translations'
import type { Lang, ServiceId } from '../lib/types'
import { Icon } from '../components/Icons'
import { KioskHeader } from '../components/KioskHeader'
import { RequestCard } from '../components/RequestCard'

/**
 * Service catalogue. Cards come straight from REQUEST_TYPES so adding or
 * removing a service is a data change, not a layout change.
 * Tracking is visually separated below the divider — it is not a service.
 */
export function RequestSelection({
  t,
  lang,
  onLangChange,
  onSelect,
  onTrack,
  onCancel,
}: {
  t: Translator
  lang: Lang
  onLangChange: (lang: Lang) => void
  onSelect: (service: ServiceId) => void
  onTrack: () => void
  onCancel: () => void
}) {
  return (
    <main className="min-h-screen bg-surface">
      <KioskHeader onCancel={onCancel} t={t} />

      <section className="animate-rise mx-auto w-full max-w-[1120px] px-4 py-8 sm:px-6 md:px-10 lg:py-10">
        <div className="max-w-3xl">
          <p className="eyebrow">{t('brand.kioskShort')}</p>
          <h1 className="page-title mt-2">{t('selection.title')}</h1>
          <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
            {t('selection.instruction')}
          </p>
        </div>

        {/* Two cards per row on desktop; the odd final card is centred and
            capped to the same width so it never stretches across the grid. */}
        <div className="mt-8 grid gap-5 sm:gap-6 md:auto-rows-fr md:grid-cols-2">
          {REQUEST_TYPES.map((config, index) => (
            <div
              className={`min-w-0 ${
                index === REQUEST_TYPES.length - 1 && REQUEST_TYPES.length % 2 === 1
                  ? 'md:col-span-2 md:mx-auto md:w-[calc(50%-0.75rem)]'
                  : ''
              }`}
              key={config.id}
            >
              <RequestCard
                config={config}
                onSelect={() => onSelect(config.id)}
                selected={false}
                t={t}
              />
            </div>
          ))}
        </div>

        <p className="mt-6 flex items-start gap-2 text-sm text-muted">
          <Icon className="mt-0.5 shrink-0" name="info" size={16} />
          {t('selection.demoNote')}
        </p>

        <div className="mt-10 border-t border-line pt-8">
          <div className="card flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center md:p-7">
            <div className="flex items-start gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-surface text-muted ring-1 ring-line">
                <Icon name="search" size={26} />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">
                  {t('selection.trackTitle')}
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                  {t('selection.trackDesc')}
                </p>
              </div>
            </div>
            <button className="btn btn-secondary w-full shrink-0 sm:w-auto" onClick={onTrack} type="button">
              <Icon name="search" size={20} />
              {t('selection.trackButton')}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
