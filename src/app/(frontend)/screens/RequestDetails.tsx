'use client'

import { useMemo, useRef, useState } from 'react'
import type { RequestTypeConfig } from '../data/requestTypes'
import type { Translator, TranslationKey } from '../data/translations'
import type { DetailsState } from '../hooks/useKioskSession'
import { focusField } from '../lib/scroll'
import { FieldGroup, FormInput, FormTextArea } from '../components/FormInput'
import { Icon } from '../components/Icons'
import { ProgressIndicator } from '../components/ProgressIndicator'

type FieldKey = 'optionId' | 'purpose' | 'copies'

/**
 * Step 2. Renders only the fields the selected service actually needs, driven
 * by the RequestTypeConfig flags. Two columns on desktop keep the whole step
 * inside one viewport; narrower screens stack and scroll normally.
 */
export function RequestDetails({
  t,
  config,
  details,
  onChange,
  onNext,
  onBack,
}: {
  t: Translator
  config: RequestTypeConfig
  details: DetailsState
  onChange: (patch: Partial<DetailsState>) => void
  onNext: () => void
  onBack: () => void
}) {
  const [attempted, setAttempted] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})

  const fieldRefs = useRef<Partial<Record<FieldKey, HTMLElement | null>>>({})
  const setRef = (field: FieldKey) => (element: HTMLElement | null) => {
    fieldRefs.current[field] = element
  }

  const markTouched = (field: FieldKey) => setTouched((current) => ({ ...current, [field]: true }))

  const copies = Number(details.copies)
  const copiesValid = !config.needsCopies || (Number.isFinite(copies) && copies >= 1)
  const purposeValid = details.purpose.trim().length > 0
  const optionValid = details.optionId.length > 0

  const errors: Partial<Record<FieldKey, string>> = {}
  if (!optionValid) errors.optionId = t('details.error.option')
  if (details.optionId === 'others_specify' && !details.othersSpecified.trim()) errors.optionId = t('details.error.othersSpecified')
  if (!purposeValid) errors.purpose = t('details.error.purpose')
  if (!copiesValid) errors.copies = t('details.error.copies')

  const errorFor = (field: FieldKey) => ((attempted || touched[field]) && errors[field] ? errors[field] : undefined)

  const purposeLabel = useMemo(
    () => (config.id === 'leave_review' ? t('details.purposeReview') : t('details.purpose')),
    [config.id, t],
  )

  const showOthersField = config.id === 'others' && details.optionId === 'others_specify'

  const handleNext = () => {
    setAttempted(true)
    const order: FieldKey[] = ['optionId', 'purpose']
    if (config.needsCopies) order.push('copies')
    const firstInvalid = order.find((field) => errors[field])
    if (!firstInvalid) {
      onNext()
      return
    }
    focusField(fieldRefs.current[firstInvalid])
  }

  return (
    <main className="min-h-dvh bg-surface">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col px-4 pb-4 pt-4 sm:px-6 md:px-8">
        <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-dark">
              <Icon name={config.icon} size={20} />
            </span>
            <div className="min-w-0">
              <p className="eyebrow">{t(config.labelKey)}</p>
              <h1 className="page-title mt-0.5">{t('details.title')}</h1>
            </div>
          </div>
          <ProgressIndicator current={2} t={t} />
        </header>
        <p className="mt-1.5 text-sm text-muted">{t('details.subtitle')}</p>

        <form
          className="mt-3"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            handleNext()
          }}
        >
          {config.noticeKey && (
            <div className="notice notice-warn mb-3 !py-2.5">
              <Icon className="mt-0.5 shrink-0" name="info" size={18} />
              <span className="min-w-0 text-xs leading-relaxed">
                {t(config.noticeKey)}
                {config.category === 'loan' && (
                  <span className="mt-0.5 block opacity-80">{t('details.loanPlaceholderNote')}</span>
                )}
              </span>
            </div>
          )}

          <div className="card animate-rise p-4 md:p-5">
            <div className="grid gap-x-6 gap-y-4 lg:grid-cols-2">
              <FieldGroup
                error={errorFor('optionId')}
                errorId="optionId-error"
                label={t(config.optionLabelKey)}
                required
              >
                <div
                  aria-invalid={errorFor('optionId') ? true : undefined}
                  aria-label={t(config.optionLabelKey)}
                  className={`grid gap-2 sm:col-span-2 ${config.options.length > 2 ? 'sm:grid-cols-2' : ''}`}
                  role="group"
                >
                  {config.options.map((option, index) => {
                    const active = details.optionId === option.id
                    const invalid = !optionValid && (attempted || touched.optionId)
                    return (
                      <button
                        aria-pressed={active}
                        className={`flex min-h-12 min-w-0 items-center gap-2.5 rounded-lg border-2 px-3 text-left text-sm font-bold transition ${
                          active
                            ? 'border-brand-dark bg-brand-soft text-brand-dark'
                            : invalid
                              ? 'border-danger bg-white text-muted'
                              : 'border-line bg-white text-muted hover:border-slate-300'
                        }`}
                        key={option.id}
                        onClick={() => {
                          onChange({ optionId: option.id })
                          markTouched('optionId')
                        }}
                        ref={index === 0 ? setRef('optionId') : undefined}
                        type="button"
                      >
                        <span
                          className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                            active ? 'border-brand-dark bg-brand-dark text-white' : 'border-slate-300'
                          }`}
                        >
                          {active && <Icon name="check" size={12} />}
                        </span>
                        <span className="min-w-0">{t(option.labelKey)}</span>
                      </button>
                    )
                  })}
                </div>
              </FieldGroup>

              <div className="grid content-start gap-3">
                <FormTextArea
                  error={errorFor('purpose')}
                  id="purpose"
                  label={purposeLabel}
                  onBlur={() => markTouched('purpose')}
                  onChange={(value) => onChange({ purpose: value })}
                  placeholder={t('details.purpose')}
                  required
                  rows={3}
                  textareaRef={setRef('purpose')}
                  value={details.purpose}
                />

                {config.needsCopies ? (
                  <FormInput
                    error={errorFor('copies')}
                    hint={t('details.copiesHint')}
                    id="copies"
                    inputMode="numeric"
                    inputRef={setRef('copies')}
                    label={t('details.copies')}
                    onBlur={() => markTouched('copies')}
                    onChange={(value) => onChange({ copies: value })}
                    required
                    value={details.copies}
                  />
                ) : (
                  <FormInput
                    id="remarks"
                    label={t('details.remarks')}
                    onChange={(value) => onChange({ remarks: value })}
                    placeholder={t('details.remarks')}
                    value={details.remarks}
                  />
                )}

                {showOthersField && (
                  <FormInput
                    error={
                      details.optionId === 'others_specify' && !details.othersSpecified.trim()
                        ? t('details.error.othersSpecified')
                        : undefined
                    }
                    id="othersSpecified"
                    label={t('details.othersSpecified')}
                    onChange={(value) => onChange({ othersSpecified: value })}
                    placeholder={t('details.purpose')}
                    required
                    value={details.othersSpecified}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <button className="btn btn-secondary" onClick={onBack} type="button">
              <Icon name="arrowLeft" size={20} />
              {t('common.back')}
            </button>
            <p aria-live="polite" className="order-last text-center text-xs text-muted sm:order-none sm:flex-1 sm:px-4 sm:text-left">
              {attempted && Object.keys(errors).length > 0
                ? t('common.fixErrors' as TranslationKey)
                : t('common.requiredNote' as TranslationKey)}
            </p>
            <button className="btn btn-primary sm:min-w-56" type="submit">
              {t('common.next')}
              <Icon name="chevronRight" size={20} />
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
