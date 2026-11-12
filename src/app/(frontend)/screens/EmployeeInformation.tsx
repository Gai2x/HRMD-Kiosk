'use client'

import { useMemo, useRef, useState } from 'react'
import { OFFICES } from '../data/mockRequests'
import type { TranslationKey, Translator } from '../data/translations'
import { isValidContact, isValidEmail } from '../lib/format'
import { focusField } from '../lib/scroll'
import {
  EMPLOYMENT_STATUSES,
  type EmployeeInfo,
  type EmploymentStatus,
} from '../lib/types'
import { FieldGroup, FormInput, FormSelect } from '../components/FormInput'
import { Icon } from '../components/Icons'
import { ProgressIndicator } from '../components/ProgressIndicator'

type FieldKey = Exclude<keyof EmployeeInfo, 'employeeNumber'>

const STATUS_LABEL_KEYS: Record<EmploymentStatus, TranslationKey> = {
  Permanent: 'employee.status.permanent',
  Casual: 'employee.status.casual',
  'Job Order': 'employee.status.jobOrder',
  'Contract of Service (COS)': 'employee.status.cos',
}

/** Visual order on screen — used to pick the first invalid field to focus. */
const FIELD_ORDER: FieldKey[] = [
  'firstName',
  'lastName',
  'position',
  'office',
  'employmentStatus',
  'email',
  'contact',
]

function getErrors(employee: EmployeeInfo): Partial<Record<FieldKey, TranslationKey>> {
  const errors: Partial<Record<FieldKey, TranslationKey>> = {}
  if (!employee.firstName.trim()) errors.firstName = 'employee.error.firstName'
  if (!employee.lastName.trim()) errors.lastName = 'employee.error.lastName'
  if (!employee.position.trim()) errors.position = 'employee.error.position'
  if (!employee.office) errors.office = 'employee.error.office'
  if (!employee.employmentStatus) errors.employmentStatus = 'employee.error.employmentStatus'
  if (!employee.email.trim()) errors.email = 'employee.error.email'
  else if (!isValidEmail(employee.email)) errors.email = 'employee.error.emailInvalid'
  if (!employee.contact.trim()) errors.contact = 'employee.error.contact'
  else if (!isValidContact(employee.contact)) errors.contact = 'employee.error.contactInvalid'
  return errors
}

/**
 * Step 1. The three groups stack vertically (name → employment → contact) with
 * two fields per row, exactly like the original layout, but the vertical rhythm
 * is tightened so the whole form still fits a single kiosk screen.
 */
export function EmployeeInformation({
  t,
  employee,
  onChange,
  onNext,
  onCancel,
}: {
  t: Translator
  employee: EmployeeInfo
  onChange: (patch: Partial<EmployeeInfo>) => void
  onNext: () => void
  onCancel: () => void
}) {
  // Once the employee has tried to continue, every invalid field is shown and
  // the messages update live as the fields are corrected.
  const [attempted, setAttempted] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})

  const fieldRefs = useRef<Partial<Record<FieldKey, HTMLElement | null>>>({})
  const setRef = (field: FieldKey) => (element: HTMLElement | null) => {
    fieldRefs.current[field] = element
  }

  const errors = useMemo(() => getErrors(employee), [employee])
  const valid = Object.keys(errors).length === 0

  const markTouched = (field: FieldKey) => setTouched((current) => ({ ...current, [field]: true }))
  const errorFor = (field: FieldKey) =>
    (attempted || touched[field]) && errors[field] ? t(errors[field]!) : undefined

  const handleNext = () => {
    setAttempted(true)
    const firstInvalid = FIELD_ORDER.find((field) => errors[field])
    if (!firstInvalid) {
      onNext()
      return
    }
    focusField(fieldRefs.current[firstInvalid])
  }

  const legend = (step: number, label: string) => (
    <legend className="mb-1.5 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink">
      <span className="grid size-6 place-items-center rounded-md bg-brand-soft text-xs font-bold text-brand-dark">
        {step}
      </span>
      {label}
    </legend>
  )

  return (
    <main className="min-h-dvh bg-surface">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col px-4 pb-3 pt-3 sm:px-6 md:px-8">
        <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h1 className="page-title">{t('employee.title')}</h1>
            <p className="mt-1 text-sm text-muted">{t('employee.subtitle')}</p>
          </div>
          <ProgressIndicator current={1} t={t} />
        </header>

        <form
          className="mt-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            handleNext()
          }}
        >
          <div className="card px-4 py-2 md:px-5">
            {/* ------------------------------------------- employee name */}
            <fieldset className="min-w-0">
              {legend(1, t('employee.section.name'))}
              <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                <FormInput
                  error={errorFor('firstName')}
                  id="firstName"
                  inputRef={setRef('firstName')}
                  label={t('employee.firstName')}
                  onBlur={() => markTouched('firstName')}
                  onChange={(value) => onChange({ firstName: value })}
                  placeholder={t('employee.placeholder.firstName')}
                  required
                  value={employee.firstName}
                />
                <FormInput
                  error={errorFor('lastName')}
                  id="lastName"
                  inputRef={setRef('lastName')}
                  label={t('employee.lastName')}
                  onBlur={() => markTouched('lastName')}
                  onChange={(value) => onChange({ lastName: value })}
                  placeholder={t('employee.placeholder.lastName')}
                  required
                  value={employee.lastName}
                />
                <FormInput
                  error={errorFor('middleName')}
                  id="middleName"
                  inputRef={setRef('middleName')}
                  label={t('employee.middleName')}
                  onBlur={() => markTouched('middleName')}
                  onChange={(value) => onChange({ middleName: value })}
                  placeholder={t('employee.placeholder.middleName')}
                  value={employee.middleName}
                />
                <FormInput
                  error={errorFor('suffix')}
                  id="suffix"
                  inputRef={setRef('suffix')}
                  label={t('employee.suffix')}
                  onBlur={() => markTouched('suffix')}
                  onChange={(value) => onChange({ suffix: value })}
                  placeholder={t('employee.placeholder.suffix')}
                  value={employee.suffix}
                />
              </div>
            </fieldset>

            <div className="my-1 border-t border-line" />

            {/* ---------------------------------------- employment info */}
            <fieldset className="min-w-0">
              {legend(2, t('employee.section.employment'))}
              <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                <FormInput
                  error={errorFor('position')}
                  id="position"
                  inputRef={setRef('position')}
                  label={t('employee.position')}
                  onBlur={() => markTouched('position')}
                  onChange={(value) => onChange({ position: value })}
                  placeholder={t('employee.placeholder.position')}
                  required
                  value={employee.position}
                />
                <FormSelect
                  error={errorFor('office')}
                  id="office"
                  label={t('employee.office')}
                  onBlur={() => markTouched('office')}
                  onChange={(value) => onChange({ office: value })}
                  options={OFFICES}
                  placeholder={t('employee.selectOffice')}
                  required
                  selectRef={setRef('office')}
                  value={employee.office}
                />
                <FieldGroup
                  error={errorFor('employmentStatus')}
                  errorId="employmentStatus-error"
                  label={t('employee.employmentStatus')}
                  required
                >
                  <div
                    aria-invalid={errorFor('employmentStatus') ? true : undefined}
                    aria-label={t('employee.employmentStatus')}
                    className="grid grid-cols-2 gap-2 sm:col-span-2 lg:grid-cols-4"
                    role="group"
                  >
                    {EMPLOYMENT_STATUSES.map((status, index) => {
                      const active = employee.employmentStatus === status
                      return (
                        <button
                          aria-pressed={active}
                          className={`flex min-h-12 items-center gap-2 rounded-lg border-2 px-2.5 text-left text-xs font-bold transition ${
                            active
                              ? 'border-brand-dark bg-brand-soft text-brand-dark'
                              : errors.employmentStatus && (attempted || touched.employmentStatus)
                                ? 'border-danger bg-white text-muted'
                                : 'border-line bg-white text-muted hover:border-slate-300'
                          }`}
                          key={status}
                          onClick={() => {
                            onChange({ employmentStatus: status })
                            markTouched('employmentStatus')
                          }}
                          ref={index === 0 ? setRef('employmentStatus') : undefined}
                          type="button"
                        >
                          <span
                            className={`grid size-4 shrink-0 place-items-center rounded-full border-2 ${
                              active ? 'border-brand-dark bg-brand-dark text-white' : 'border-slate-300'
                            }`}
                          >
                            {active && <Icon name="check" size={11} />}
                          </span>
                          <span className="min-w-0">{t(STATUS_LABEL_KEYS[status])}</span>
                        </button>
                      )
                    })}
                  </div>
                </FieldGroup>
              </div>
            </fieldset>

            <div className="my-1 border-t border-line" />

            {/* ---------------------------------------- contact details */}
            <fieldset className="min-w-0">
              {legend(3, t('employee.section.contact'))}
              <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                <FormInput
                  autoComplete="email"
                  error={errorFor('email')}
                  id="email"
                  inputRef={setRef('email')}
                  label={t('employee.email')}
                  onBlur={() => markTouched('email')}
                  onChange={(value) => onChange({ email: value })}
                  placeholder={t('employee.placeholder.email')}
                  required
                  type="email"
                  value={employee.email}
                />
                <FormInput
                  autoComplete="tel"
                  error={errorFor('contact')}
                  id="contact"
                  inputMode="tel"
                  inputRef={setRef('contact')}
                  label={t('employee.contact')}
                  maxLength={13}
                  onBlur={() => markTouched('contact')}
                  onChange={(value) => onChange({ contact: value })}
                  placeholder={t('employee.placeholder.contact')}
                  required
                  type="tel"
                  value={employee.contact}
                />
              </div>
            </fieldset>
          </div>

          <div className="mt-4 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <button className="btn btn-danger sm:min-w-40" onClick={onCancel} type="button">
              <Icon name="x" size={20} />
              {t('common.cancel')}
            </button>
            <p aria-live="polite" className="order-last text-center text-xs text-muted sm:order-none sm:flex-1 sm:px-4 sm:text-left">
              {attempted && !valid ? t('common.fixErrors' as TranslationKey) : t('common.requiredNote' as TranslationKey)}
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
