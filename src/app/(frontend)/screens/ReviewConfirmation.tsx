'use client'

import { useRef, useState } from 'react'
import type { Translator } from '../data/translations'
import type { DetailsState } from '../hooks/useKioskSession'
import { formatEmployeeName, type EmployeeInfo, type Lang } from '../lib/types'
import type { RequestTypeConfig } from '../data/requestTypes'
import { Icon } from '../components/Icons'
import { ProgressIndicator } from '../components/ProgressIndicator'

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-w-0 gap-0.5 border-b border-line py-1.5 last:border-b-0 sm:grid-cols-[45%_1fr] sm:gap-3">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-bold text-ink">{value || '—'}</dd>
    </div>
  )
}

/**
 * Step 3. Everything shown here comes from the session state, so the employee
 * sees exactly what HRMD would receive. Compact by design: the two summaries,
 * the confirmation notice, the certification and the actions share one screen.
 */
export function ReviewConfirmation({
  t,
  config,
  employee,
  details,
  optionLabel,
  certified,
  onToggleCertified,
  onSubmit,
  onBack,
  submitting,
  error,
}: {
  t: Translator
  config: RequestTypeConfig
  employee: EmployeeInfo
  details: DetailsState
  optionLabel: string
  certified: boolean
  onToggleCertified: () => void
  onSubmit: () => void
  onBack: () => void
  submitting: boolean
  error?: string
}) {
  const certifyRef = useRef<HTMLButtonElement>(null)
  const [certifyError, setCertifyError] = useState<string | undefined>(undefined)

  const employeeRows: Array<[string, string]> = [
    [t('employee.lastName') + ', ' + t('employee.firstName'), formatEmployeeName(employee)],
    [t('employee.position'), employee.position],
    [t('employee.office'), employee.office],
    [t('employee.employmentStatus'), employee.employmentStatus],
    [t('employee.email'), employee.email],
    [t('employee.contact'), employee.contact],
  ]

  const requestRows: Array<[string, string]> = [
    [t('success.type'), t(config.labelKey)],
    [t(config.optionLabelKey), optionLabel],
    [config.id === 'leave_review' ? t('details.purposeReview') : t('details.purpose'), details.purpose],
    ...(config.needsCopies ? [[t('details.copies'), details.copies] as [string, string]] : []),
    ...(!config.needsCopies && details.remarks
      ? [[t('details.remarks'), details.remarks] as [string, string]]
      : []),
    ...(config.id === 'others' && details.optionId === 'others_specify' && details.othersSpecified
      ? [[t('details.othersSpecified'), details.othersSpecified] as [string, string]]
      : []),
  ]

  const shownError = certifyError ?? error

  const handleSubmit = () => {
    if (submitting) return
    if (!certified) {
      setCertifyError(t('review.error.certify'))
      certifyRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' })
      certifyRef.current?.focus({ preventScroll: true })
      return
    }
    setCertifyError(undefined)
    onSubmit()
  }

  return (
    <main className="min-h-dvh bg-surface">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col px-4 pb-4 pt-4 sm:px-6 md:px-8">
        <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h1 className="page-title">{t('review.title')}</h1>
            <p className="mt-1 text-sm text-muted">{t('review.subtitle')}</p>
          </div>
          <ProgressIndicator current={3} t={t} />
        </header>

        <div className="mt-4 grid animate-rise gap-4 lg:grid-cols-2">
          <section className="card min-w-0 overflow-hidden">
            <h2 className="border-b border-line bg-surface px-4 py-2 font-display text-sm font-bold text-ink">
              {t('review.section.employee')}
            </h2>
            <dl className="px-4 py-1">
              {employeeRows.map(([label, value]) => (
                <SummaryRow key={label} label={label} value={value} />
              ))}
            </dl>
          </section>

          <section className="card min-w-0 overflow-hidden">
            <h2 className="border-b border-line bg-surface px-4 py-2 font-display text-sm font-bold text-ink">
              {t('review.section.request')}
            </h2>
            <dl className="px-4 py-1">
              {requestRows.map(([label, value]) => (
                <SummaryRow key={label} label={label} value={value} />
              ))}
            </dl>
          </section>
        </div>

        <div className="notice mt-3 !py-2.5">
          <Icon className="mt-0.5 shrink-0" name="mail" size={18} />
          <span className="min-w-0 break-words text-xs leading-relaxed">{t('review.confirm', { email: employee.email })}</span>
        </div>

        <button
          aria-describedby={shownError ? 'certify-error' : undefined}
          aria-invalid={shownError ? true : undefined}
          aria-pressed={certified}
          className={`mt-3 flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition ${
            shownError
              ? 'border-danger bg-danger-soft'
              : certified
                ? 'border-brand bg-brand-soft'
                : 'border-line bg-white hover:border-slate-300'
          }`}
          onClick={() => {
            setCertifyError(undefined)
            onToggleCertified()
          }}
          ref={certifyRef}
          type="button"
        >
          <span
            className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border-2 ${
              certified ? 'border-brand-dark bg-brand-dark text-white' : 'border-slate-300'
            }`}
          >
            {certified && <Icon name="check" size={15} />}
          </span>
          <span className="min-w-0">
            <strong className="block text-sm font-bold text-ink">{t('review.certify')}</strong>
            <span className="mt-0.5 block text-xs text-muted">{t('review.certifyNote')}</span>
          </span>
        </button>

        {shownError && (
          <p
            aria-live="polite"
            className="mt-2 flex items-center gap-2 text-sm font-semibold text-danger"
            id="certify-error"
          >
            <Icon className="shrink-0" name="warning" size={16} />
            {shownError}
          </p>
        )}

        <div className="mt-4 flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
          <button className="btn btn-secondary" disabled={submitting} onClick={onBack} type="button">
            <Icon name="arrowLeft" size={20} />
            {t('common.back')}
          </button>
          <button className="btn btn-primary sm:min-w-64" disabled={submitting} onClick={handleSubmit} type="button">
            {submitting ? (
              <>
                <span className="spinner" />
                {t('review.submitting')}
              </>
            ) : (
              <>
                {t('common.submit')}
                <Icon name="send" size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  )
}
