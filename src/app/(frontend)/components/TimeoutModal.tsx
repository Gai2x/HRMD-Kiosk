'use client'

import type { Translator } from '../data/translations'
import { Icon } from './Icons'

/** Warning shown shortly before the shared kiosk clears itself for the next user. */
export function TimeoutModal({
  seconds,
  onStay,
  onEnd,
  t,
}: {
  seconds: number
  onStay: () => void
  onEnd: () => void
  t: Translator
}) {
  return (
    <div
      aria-live="assertive"
      className="animate-fade fixed inset-0 z-50 grid place-items-center bg-ink/70 p-5 backdrop-blur-sm"
      role="alertdialog"
    >
      <div className="animate-pop w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <Icon name="clock" size={28} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-bold text-ink">{t('timeout.title')}</h2>
            <p className="mt-2 leading-relaxed text-muted">
              {t('timeout.message', { seconds })}
            </p>
          </div>
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-amber-500 transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.max(0, Math.min(100, (seconds / 10) * 100))}%` }}
          />
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button className="btn btn-secondary" onClick={onEnd} type="button">
            {t('timeout.end')}
          </button>
          <button className="btn btn-primary" onClick={onStay} type="button">
            <Icon name="refresh" size={19} />
            {t('timeout.stay')}
          </button>
        </div>
      </div>
    </div>
  )
}
