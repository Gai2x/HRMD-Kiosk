'use client'

import { useRef, useState } from 'react'
import { DEMO_REFERENCES } from '../data/mockRequests'
import { getOptionLabelKey, getRequestType } from '../data/requestTypes'
import type { Translator } from '../data/translations'
import {
  formatDate,
  formatDateTime,
  statusDescriptionKey,
  statusLabelKey,
  statusStageIndex,
  statusTone,
} from '../lib/format'
import { lookupRequestRemote } from '../lib/request-store'
import { focusField } from '../lib/scroll'
import { STATUS_FLOW, type HrmdRequest } from '../lib/types'
import { FormInput } from '../components/FormInput'
import { Icon } from '../components/Icons'

function maskedName(request: HrmdRequest) {
  const { firstName, lastName } = request.employee
  return `${lastName.charAt(0) || '•'}•••, ${firstName.charAt(0) || '•'}•••`
}

/**
 * Read-only tracking. Deliberately shows no contact details or documents —
 * reference number plus status only, exactly what a kiosk screen may reveal.
 */
export function TrackRequest({
  t,
  onBack,
}: {
  t: Translator
  onBack: () => void
}) {
  const [reference, setReference] = useState('')
  const [state, setState] = useState<'idle' | 'checking' | 'result'>('idle')
  const [request, setRequest] = useState<HrmdRequest | null>(null)
  const [error, setError] = useState<'required' | 'not-found' | null>(null)
  const referenceRef = useRef<HTMLInputElement>(null)

  const check = async (value = reference) => {
    setError(null)
    setRequest(null)

    if (!value.trim()) {
      setError('required')
      setState('idle')
      focusField(referenceRef.current)
      return
    }

    setState('checking')
    const outcome = await lookupRequestRemote(value)
    if (!outcome.ok) {
      setError('not-found')
      setState('idle')
      return
    }

    // Short dwell so the kiosk shows a realistic checking state.
    window.setTimeout(() => {
      setRequest(outcome.request)
      setState('result')
    }, 350)
  }

  const reset = () => {
    setRequest(null)
    setError(null)
    setState('idle')
  }

  const typeLabel = request
    ? (() => {
        const config = getRequestType(request.service)
        const optionKey = getOptionLabelKey(request.service, request.optionId)
        const service = t(config.labelKey)
        if (!optionKey) return service
        const option = t(optionKey)
        let label = option === service ? service : `${service} — ${option}`
        if (request.service === 'others' && request.optionId === 'others_specify' && request.othersSpecified) {
          label += ` (${request.othersSpecified})`
        } else if (request.optionId === 'others_specify' && request.othersSpecified) {
          label += ` — ${request.othersSpecified}`
        }
        return label
      })()
    : ''

  const stage = request ? statusStageIndex(request.status) : 0

  return (
    <main className="min-h-dvh bg-surface">
      <section className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 md:px-8">
        <button
          className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-ink"
          onClick={onBack}
          type="button"
        >
          <Icon name="arrowLeft" size={18} />
          {t('track.back')}
        </button>

        <div className="card animate-rise p-4 md:p-5">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <p className="eyebrow">{t('brand.kioskShort')}</p>
              <h1 className="page-title mt-1">{t('track.title')}</h1>
              <p className="mt-1 text-sm text-muted">{t('track.instruction')}</p>
            </div>
          </div>

          {state !== 'result' && (
            <>
              <form
                className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start"
                onSubmit={(event) => {
                  event.preventDefault()
                  void check()
                }}
              >
                <div className="min-w-0 flex-1">
                  <FormInput
                    error={error === 'required' ? t('track.error.required') : undefined}
                    id="reference"
                    inputRef={referenceRef}
                    label={t('track.referenceLabel')}
                    onChange={(value) => {
                      setReference(value)
                      setError(null)
                    }}
                    placeholder="HR-2026-0006"
                    required
                    textTransform="uppercase"
                    value={reference}
                  />
                </div>
                <button
                  className="btn btn-primary shrink-0 sm:mt-7 sm:min-w-56"
                  disabled={state === 'checking'}
                  type="submit"
                >
                  {state === 'checking' ? <span className="spinner" /> : <Icon name="search" size={20} />}
                  {state === 'checking' ? t('track.checking') : t('track.check')}
                </button>
              </form>

              {error === 'not-found' && (
                <div
                  aria-live="polite"
                  className="animate-rise mt-3 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-800"
                >
                  <Icon className="mt-0.5 shrink-0" name="warning" size={18} />
                  <p className="text-sm font-semibold">{t('track.error.notFound')}</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted">
                  {t('track.example', { reference: DEMO_REFERENCES[0] })}
                </span>
                {DEMO_REFERENCES.map((demo) => (
                  <button
                    className="rounded-lg bg-surface px-3 py-1.5 font-mono text-xs font-bold text-ink ring-1 ring-line hover:bg-white"
                    key={demo}
                    onClick={() => {
                      setReference(demo)
                      void check(demo)
                    }}
                    type="button"
                  >
                    {demo}
                  </button>
                ))}
              </div>
            </>
          )}

          {state === 'result' && request && (
            <div className="animate-rise mt-4 grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className={`rounded-xl bg-gradient-to-r p-4 text-white ${statusTone(request.status).accent}`}>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/70">
                    {t('success.status')}
                  </p>
                  <h2 className="mt-0.5 font-display text-xl font-extrabold sm:text-2xl">
                    {t(statusLabelKey(request.status))}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/85">
                    {t(statusDescriptionKey(request.status))}
                  </p>
                  <p className="mt-2.5 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                    {t('track.lastUpdated')}: {formatDateTime(request.history[0].at)}
                  </p>
                </div>

                <dl className="grid gap-3 rounded-xl border border-line bg-white p-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-muted">
                      {t('track.reference')}
                    </dt>
                    <dd className="mt-0.5 font-mono text-base font-bold text-brand-dark">
                      {request.reference}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-muted">
                      {t('track.type')}
                    </dt>
                    <dd className="mt-0.5 break-words text-sm font-bold text-ink">{typeLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-muted">
                      {t('track.submitted')}
                    </dt>
                    <dd className="mt-0.5 text-sm font-bold text-ink">{formatDate(request.submittedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-muted">
                      {t('track.maskedEmployee')}
                    </dt>
                    <dd className="mt-0.5 text-sm font-bold text-ink">{maskedName(request)}</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-3">
                {stage >= 0 && (
                  <div className="rounded-xl border border-line bg-white p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{t('track.timeline')}</h3>
                    <ol className="mt-3 grid grid-cols-4 gap-1.5">
                      {STATUS_FLOW.map((flowStatus, index) => {
                        const done = index <= stage
                        return (
                          <li className="relative text-center" key={flowStatus}>
                            <span
                              aria-hidden="true"
                              className={`absolute left-0 right-0 top-3 h-0.5 ${
                                index <= stage ? 'bg-brand' : 'bg-line'
                              } ${index === 0 ? 'left-1/2' : ''} ${
                                index === STATUS_FLOW.length - 1 ? 'right-1/2' : ''
                              }`}
                            />
                            <span
                              className={`relative mx-auto grid size-6 place-items-center rounded-full border-2 border-white text-[0.65rem] font-bold ${
                                done ? 'bg-brand-dark text-white' : 'bg-line text-muted'
                              }`}
                            >
                              {done ? <Icon name="check" size={12} /> : index + 1}
                            </span>
                            <p
                              className={`mt-1.5 text-[0.65rem] font-bold leading-tight ${
                                done ? 'text-ink' : 'text-muted'
                              }`}
                            >
                              {t(statusLabelKey(flowStatus))}
                            </p>
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                )}

                <div className="rounded-xl border border-line bg-white p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{t('track.history')}</h3>
                  <ol className="mt-2 space-y-2">
                    {request.history.map((event, index) => (
                      <li className="relative flex gap-2.5" key={`${event.status}-${event.at}`}>
                        <span
                          className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
                            index === 0 ? 'bg-brand-dark text-white' : 'bg-line text-muted'
                          }`}
                        >
                          <Icon name={index === 0 ? 'check' : 'clock'} size={12} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-ink">{t(statusLabelKey(event.status))}</p>
                          <p className="text-xs text-muted">
                            {event.note ?? (event.by === 'Kiosk' ? t('track.demoNotice') : event.by)}
                          </p>
                          <p className="text-[0.65rem] text-slate-400">{formatDateTime(event.at)}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <button className="btn btn-secondary w-full !min-h-11 !text-sm" onClick={reset} type="button">
                  <Icon name="search" size={18} />
                  {t('track.another')}
                </button>
              </div>
            </div>
          )}

          <div className="notice mt-4 !py-2.5">
            <Icon className="mt-0.5 shrink-0" name="shield" size={18} />
            <span className="text-xs leading-relaxed">{t('track.demoNotice')}</span>
          </div>
        </div>
      </section>
    </main>
  )
}
