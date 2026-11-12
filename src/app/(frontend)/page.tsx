'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createTranslator } from './data/translations'
import type { Lang } from './lib/types'
import { useKioskSession } from './hooks/useKioskSession'
import { resetScrollPosition } from './lib/scroll'
import { submitRequest } from './lib/request-store'
import { getRequestType } from './data/requestTypes'
import { formatClock, formatLongDay } from './lib/format'
import { Icon } from './components/Icons'
import { LanguageToggle } from './components/LanguageToggle'
import { RequestCard } from './components/RequestCard'
import { REQUEST_TYPES } from './data/requestTypes'
import type { ServiceId } from './lib/types'
import { FigmaNetworkBackground } from './components/FigmaNetworkBackground'
import { TrackRequest } from './screens/TrackRequest'
import { EmployeeInformation } from './screens/EmployeeInformation'
import { RequestDetails } from './screens/RequestDetails'
import { ReviewConfirmation } from './screens/ReviewConfirmation'
import { SuccessScreen } from './screens/SuccessScreen'
import './components/FigmaNetworkBackground.css'

const SUCCESS_RESET_SECONDS = 20

export default function Page() {
  const session = useKioskSession()
  const { step, serviceId, employee, details, receipt, reset } = session

  const [lang, setLang] = useState<Lang>('en')
  const t = useMemo(() => createTranslator(lang), [lang])
  const [now, setNow] = useState<Date | null>(null)
  const [showTrack, setShowTrack] = useState(false)
  const [certified, setCertified] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)
  const [successSeconds, setSuccessSeconds] = useState(SUCCESS_RESET_SECONDS)
  // The leave-confirmation dialog only appears when Cancel is pressed — it must
  // never open on its own when the employee enters a request.
  const [confirmLeave, setConfirmLeave] = useState(false)
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setNow(new Date())
    const clock = setInterval(() => setNow(new Date()), 30_000)
    return () => {
      clearInterval(clock)
      if (submitTimer.current) clearTimeout(submitTimer.current)
    }
  }, [])

  useEffect(() => {
    resetScrollPosition(document.getElementById('root'))
  }, [step, showTrack])

  useEffect(() => {
    if (step !== 5) return
    setSuccessSeconds(SUCCESS_RESET_SECONDS)
    const timer = setInterval(() => {
      setSuccessSeconds((current) => {
        if (current <= 1) {
          clearInterval(timer)
          endSession()
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [step])

  const clearSubmitTimer = () => {
    if (submitTimer.current) clearTimeout(submitTimer.current)
    submitTimer.current = null
  }

  const endSession = useCallback(() => {
    clearSubmitTimer()
    setShowTrack(false)
    setConfirmLeave(false)
    setCertified(false)
    setSubmitting(false)
    setSubmitError(undefined)
    setSuccessSeconds(SUCCESS_RESET_SECONDS)
    reset()
  }, [reset])

  const config = serviceId ? getRequestType(serviceId) : null

  const selectService = (id: ServiceId) => {
    session.selectService(id)
    const selected = getRequestType(id)
    if (selected.options.length === 1) {
      session.patchDetails({ optionId: selected.options[0].id })
    }
    session.patchDetails({ othersSpecified: '' })
  }

  const submit = () => {
    if (!config || !serviceId || !certified || submitting) return
    setSubmitError(undefined)

    if (!details.optionId) {
      setSubmitError(t('details.error.option'))
      return
    }

    setSubmitting(true)
    submitTimer.current = setTimeout(() => {
      void (async () => {
        try {
          const created = await submitRequest({
            service: serviceId,
            optionId: details.optionId,
            purpose: details.purpose.trim(),
            copies: config.needsCopies ? Number(details.copies) : undefined,
            remarks: config.needsRemarks ? details.remarks.trim() || undefined : undefined,
            employee,
            othersSpecified: details.othersSpecified.trim() || undefined,
          })
          session.complete(created)
        } catch (error) {
          setSubmitError(error instanceof Error ? error.message : 'The request could not be saved.')
        } finally {
          setSubmitting(false)
        }
      })()
    }, 900)
  }

  const optionLabelKey = config ? config.options.find((option) => option.id === details.optionId)?.labelKey : undefined
  const receiptTypeLabel = (() => {
    if (!config) return ''
    const service = t(config.labelKey)
    if (!optionLabelKey) return service
    const option = t(optionLabelKey)
    return option === service ? service : `${service} — ${option}`
  })()

  return (
    <>
      {step === 0 && !showTrack && (
        <main className="relative flex min-h-dvh flex-col bg-[#c2caf2] text-ink lg:h-dvh lg:overflow-y-auto">
          {/* Approved Figma animated pastel network. */}
          <FigmaNetworkBackground />

          <header className="relative z-10 flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 pt-4 sm:px-6 lg:px-10">
            <div className="text-left leading-tight">
              <p className="font-display text-base font-bold tabular-nums text-ink sm:text-lg">
                {now ? formatClock(now) : '--:--'}
              </p>
              <p className="text-[0.7rem] font-semibold text-ink/70 sm:text-xs">
                {now ? formatLongDay(now) : t('brand.lgu')}
              </p>
            </div>
            <LanguageToggle lang={lang} onChange={setLang} t={t} variant="bare" />
          </header>

          <section className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-5 pt-3 sm:px-6 lg:px-10">
            <div className="flex shrink-0 items-center justify-center gap-3 sm:gap-5">
              <div
                aria-label="Lungsod ng Tanjay city seal"
                className="size-14 shrink-0 overflow-hidden rounded-full shadow-lg ring-2 ring-white/70 sm:size-20"
              >
                <img
                  alt=""
                  className="size-full object-contain"
                  src="/Branding/tanjay-seal-cropped.png"
                />
              </div>
              <div
                aria-label="HRMD logo"
                className="relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white/50 shadow-md sm:size-20"
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
                <span className="font-display text-[1.7rem] font-black tracking-tight text-ink sm:text-4xl">
                  HRMD
                </span>
                <span className="mt-1 font-display text-[0.6rem] font-bold tracking-[0.25em] text-ink/70 sm:text-xs">
                  LGU TANJAY CITY
                </span>
              </div>
            </div>

            <h1 className="mt-3 text-center font-display text-[clamp(1.35rem,1.05rem+1.5vw,2.5rem)] font-extrabold leading-tight tracking-tight text-ink sm:mt-4">
              {t('welcome.heading')}
            </h1>
            <p className="mt-1.5 text-center text-[clamp(0.85rem,0.78rem+0.4vw,1.15rem)] font-semibold text-ink/75">
              {t('welcome.subtitle')}
            </p>

            <p className="mb-2.5 mt-4 text-center text-[0.68rem] font-bold uppercase tracking-[0.24em] text-ink/60 sm:text-xs">
              {t('selection.title')}
            </p>

            <div className="grid w-full max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
              {REQUEST_TYPES.map((card) => (
                <RequestCard
                  config={card}
                  dense
                  key={card.id}
                  onSelect={() => {
                    selectService(card.id as ServiceId)
                    session.goTo(2)
                  }}
                  selected={false}
                  t={t}
                />
              ))}
            </div>

            <div className="mt-4 flex w-full max-w-6xl flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
              <button
                className="btn btn-secondary shrink-0 border-ink/15 bg-white/70 text-ink hover:border-ink/30 hover:bg-white"
                onClick={() => {
                  session.goTo(1)
                  setShowTrack(true)
                }}
                type="button"
              >
                <Icon name="search" size={19} />
                {t('selection.trackTitle')}
              </button>
              <p className="text-center text-xs text-ink/60">{t('selection.demoNote')}</p>
            </div>
          </section>
        </main>
      )}

      {showTrack && (
        <TrackRequest
          onBack={() => { setShowTrack(false); session.goTo(0) }}
          t={t}
        />
      )}

      {step === 2 && !showTrack && (
        <EmployeeInformation
          employee={employee}
          onChange={session.patchEmployee}
          onNext={() => session.goTo(3)}
          onCancel={() => setConfirmLeave(true)}
          t={t}
        />
      )}

      {step === 3 && !showTrack && config && (
        <RequestDetails
          config={config}
          details={details}
          onChange={session.patchDetails}
          onNext={() => session.goTo(4)}
          onBack={() => session.goTo(2)}
          t={t}
        />
      )}

      {step === 4 && !showTrack && config && (
        <ReviewConfirmation
          certified={certified}
          config={config}
          details={details}
          employee={employee}
          error={submitError}
          onBack={() => session.goTo(3)}
          onSubmit={submit}
          onToggleCertified={() => {
            setCertified((value) => !value)
            setSubmitError(undefined)
          }}
          optionLabel={optionLabelKey ? t(optionLabelKey) : ''}
          submitting={submitting}
          t={t}
        />
      )}

      {step === 5 && receipt && (
        <SuccessScreen
          onDone={endSession}
          request={receipt}
          secondsLeft={successSeconds}
          statusLabel={t('success.statusValue')}
          t={t}
          typeLabel={receiptTypeLabel}
        />
      )}

      {confirmLeave && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            <p className="text-sm font-semibold text-muted">
              Returning to the landing page will discard unsaved progress.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                className="flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink hover:bg-surface"
                onClick={() => setConfirmLeave(false)}
                type="button"
              >
                Keep editing
              </button>
              <button
                className="flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink hover:bg-surface"
                onClick={() => {
                  setConfirmLeave(false)
                  setShowTrack(false)
                  session.goTo(0)
                }}
                type="button"
              >
                Return to landing
              </button>
              <button
                className="flex-1 rounded-xl bg-danger px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
                onClick={endSession}
                type="button"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
