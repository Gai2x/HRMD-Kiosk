'use client'

import type { Translator } from '../data/translations'
import type { HrmdRequest } from '../lib/types'
import { Icon } from '../components/Icons'
import { VirtualReceipt } from '../components/VirtualReceipt'

/**
 * Terminal state for a submission. Confirmation and receipt share the screen
 * side by side on desktop so nothing needs scrolling; the parent owns the
 * 20-second auto-reset so the countdown and the session clear stay in sync.
 */
export function SuccessScreen({
  t,
  request,
  typeLabel,
  statusLabel,
  onDone,
  secondsLeft,
}: {
  t: Translator
  request: HrmdRequest
  typeLabel: string
  statusLabel: string
  onDone: () => void
  secondsLeft: number
}) {
  return (
    <main className="min-h-dvh bg-surface">
      <section className="mx-auto grid w-full max-w-5xl items-center gap-6 px-5 py-7 lg:grid-cols-[1fr_380px] lg:gap-10 lg:py-8">
        <div>
          <div className="relative grid size-16 place-items-center">
            <span className="animate-ring absolute inset-0 rounded-full bg-brand/25" />
            <span className="animate-ring absolute inset-0 rounded-full bg-brand/20 [animation-delay:300ms]" />
            <span className="animate-check relative grid size-16 place-items-center rounded-full bg-brand text-white shadow-[0_16px_40px_rgba(16,185,129,0.4)]">
              <Icon name="check" size={34} strokeWidth={2.6} />
            </span>
          </div>

          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
            {t('success.title')}
          </h1>
          <p className="mt-1.5 text-base text-muted">{t('success.subtitle')}</p>

          <div className="notice mt-4 !py-2.5">
            <Icon className="mt-0.5 shrink-0" name="mail" size={18} />
            <span className="text-xs leading-relaxed">{t('success.note')}</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button className="btn btn-secondary" onClick={() => window.print()} type="button">
              <Icon name="printer" size={20} />
              {t('success.print')}
            </button>
            <button className="btn btn-primary" onClick={onDone} type="button">
              {t('success.done')}
              <Icon name="check" size={20} />
            </button>
          </div>

          <p aria-live="polite" className="mt-3 text-center text-sm font-semibold text-muted sm:text-left">
            {t('success.resetIn', { seconds: secondsLeft })}
          </p>
        </div>

        <div>
          <VirtualReceipt
            request={request}
            statusLabel={statusLabel}
            t={t}
            typeLabel={typeLabel}
          />
        </div>
      </section>
    </main>
  )
}
